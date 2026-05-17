# Multi-stage build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S cinema && adduser -S cinema -G cinema

# Create upload directories with proper ownership
RUN mkdir -p /app/uploads/posters /app/uploads/trailers && \
    chown -R cinema:cinema /app/uploads

COPY --from=build /app/target/*.jar app.jar

RUN chown cinema:cinema app.jar
USER cinema

EXPOSE 8080

# Healthcheck via actuator (spring-boot-starter-actuator is in pom.xml)
HEALTHCHECK --interval=30s --timeout=10s --retries=5 --start-period=60s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Optimized for small VPS (1GB RAM): Postgres ~200MB + Redis ~50MB + App ~300MB = safe
ENV JAVA_OPTS="-Xmx200m -Xms128m -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m -Djava.awt.headless=true"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar -Dspring.profiles.active=prod app.jar"]
