import json
import os
from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from kafka import KafkaConsumer
import redis
import threading

app = Flask(__name__)

redis_client = redis.Redis(
    host=os.environ.get('REDIS_HOST', 'localhost'),
    port=int(os.environ.get('REDIS_PORT', 6379)),
    decode_responses=True
)

KAFKA_BROKER = os.environ.get('KAFKA_BROKER', 'localhost:9092')
USER_EVENTS_TOPIC = 'order-events'

# Mock Data simulating a Postgres/Warehouse pull
# In reality, fetch from database periodically or on-startup
df_interactions = pd.DataFrame([
    {"user_id": "1", "product_id": "1", "rating": 5},
    {"user_id": "1", "product_id": "2", "rating": 3},
    {"user_id": "2", "product_id": "1", "rating": 4},
    {"user_id": "2", "product_id": "3", "rating": 5},
    {"user_id": "3", "product_id": "2", "rating": 4},
])

def compute_similarity():
    # Pivot table to get user-product interaction matrix
    user_item_matrix = df_interactions.pivot(index='user_id', columns='product_id', values='rating').fillna(0)
    
    # Cosine Similarity for Collaborative Filtering
    user_similarity = cosine_similarity(user_item_matrix)
    user_sim_df = pd.DataFrame(user_similarity, index=user_item_matrix.index, columns=user_item_matrix.index)
    return user_item_matrix, user_sim_df

def generate_hybrid_recommendations(user_id):
    try:
        user_item_matrix, user_sim_df = compute_similarity()
    except Exception as e:
        return [{"product_id": "1", "score": 1.0, "reason": "popular (fallback)"}]
        
    if user_id not in user_sim_df.index:
        # Hybrid feature: Fallback to popular items for cold start users
        return [
            {"product_id": "1", "score": 1.0, "reason": "popular"},
            {"product_id": "3", "score": 0.9, "reason": "popular"}
        ]
        
    # Get similar users
    similar_users = user_sim_df[user_id].sort_values(ascending=False).index[1:]
    
    recommendations = {}
    for sim_user in similar_users:
        sim_score = user_sim_df[user_id][sim_user]
        if sim_score <= 0: continue
        
        # Items bought by similar user but not by target user
        sim_user_items = user_item_matrix.loc[sim_user]
        target_user_items = user_item_matrix.loc[user_id]
        
        for item, rating in sim_user_items.items():
            if rating > 0 and target_user_items[item] == 0:
                if item not in recommendations:
                    recommendations[item] = 0
                recommendations[item] += rating * sim_score
                
    # Sort and return top 3
    sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)[:3]
    return [{"product_id": item, "score": round(score, 2), "reason": "collaborative"} for item, score in sorted_recs]

@app.route('/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    # 1. Attempt Redis Cache Retrieval
    cached_recs = redis_client.get(f"recs:{user_id}")
    if cached_recs:
        return jsonify({"user_id": user_id, "recommendations": json.loads(cached_recs), "source": "cache"})
    
    # 2. Generate Recommendations (Scikit-Learn)
    recs = generate_hybrid_recommendations(str(user_id))
    
    # 3. Cache the Result in Redis with TTL of 1 hour
    redis_client.setex(f"recs:{user_id}", 3600, json.dumps(recs))
    return jsonify({"user_id": user_id, "recommendations": recs, "source": "model"})

def consume_kafka_events():
    global df_interactions
    try:
        consumer = KafkaConsumer(
            USER_EVENTS_TOPIC,
            bootstrap_servers=[KAFKA_BROKER],
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='latest'
        )
        for message in consumer:
            event = message.value
            print(f"Received event: {event}")
            
            # Dynamic Matrix Update (In-memory for simulation)
            new_interaction = {"user_id": str(event['user_id']), "product_id": str(event['product_id']), "rating": 1}
            df_interactions = pd.concat([df_interactions, pd.DataFrame([new_interaction])], ignore_index=True)
            
            # Invalidate Cache for this user so they get fresh recommendations next time
            redis_client.delete(f"recs:{event['user_id']}")
    except Exception as e:
        print(f"Error connecting to Kafka: {e}")

if __name__ == '__main__':
    kafka_thread = threading.Thread(target=consume_kafka_events, daemon=True)
    kafka_thread.start()
    app.run(host='0.0.0.0', port=5000)
