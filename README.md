# Nexus: AI-Powered Event-Driven E-Commerce Platform

![Architecture](https://img.shields.io/badge/Architecture-Event--Driven-blue.svg)
![Microservices](https://img.shields.io/badge/Microservices-Spring%20Boot%20%7C%20Flask-green.svg)
![Messaging](https://img.shields.io/badge/Messaging-Apache%20Kafka-red.svg)
![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Redis-orange.svg)

Nexus is a scalable, distributed e-commerce platform demonstrating modern microservice architecture. It features a Java Spring Boot backend, a Python-based Machine Learning recommendation engine, and a React frontend, all communicating asynchronously via Apache Kafka.

## 🚀 Key Features

- **Event-Driven Architecture**: Uses Apache Kafka (KRaft mode) to decouple order processing from inventory management and AI model training.
- **Machine Learning Integration**: A Python microservice constantly consumes order streams to retrain a Scikit-Learn Collaborative Filtering model in real-time.
- **High-Performance Caching**: Implements Redis to cache product catalogs and heavily computed AI similarity matrices, dropping query latency to <5ms.
- **Modern UI**: A premium, glassmorphism-inspired React dashboard with dynamic shopping cart state and real-time Kafka event simulation.
- **Security**: Stateless JSON Web Token (JWT) authentication and Role-Based Access Control (RBAC).

## 🛠️ Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React, Vite, CSS3 | Sleek dashboard with bulk-checkout and training visualizers. |
| **Core API** | Java 17, Spring Boot 3 | Handles Auth, Products, and Order orchestration. |
| **AI Engine** | Python, Flask, Pandas | Generates cosine similarity matrices for recommendations. |
| **Message Broker**| Apache Kafka | Handles `order-events` streams asynchronously. |
| **Database** | PostgreSQL | Persistent relational storage for Users, Products, and Orders. |
| **Cache** | Redis | In-memory store for high-frequency ML data retrieval. |

## ⚙️ Local Development Setup

1. **Start the Infrastructure**
   ```bash
   docker-compose up -d
   ```
   *This spins up PostgreSQL, Redis, and Apache Kafka on your local network.*

2. **Start the Java API (Backend)**
   ```bash
   cd ecommerce-backend
   ./mvnw spring-boot:run
   ```

3. **Start the AI Engine (Python)**
   ```bash
   cd recommendation-service
   pip install -r requirements.txt
   python app.py
   ```

4. **Start the Frontend (React)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🧠 How the AI Engine Works

When a user places an order, the Java backend persists the order to Postgres and immediately fires a JSON event to the `order-events` Kafka topic. The Python service, running a background consumer thread, ingests this event and dynamically updates an in-memory Pandas interaction matrix. It then leverages `Scikit-Learn` to calculate new Cosine Similarity scores across all users and invalidates the stale Redis cache, ensuring the next API request fetches ultra-personalized, real-time recommendations.
