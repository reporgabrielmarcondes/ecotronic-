# Build:  docker build -t ecotronic .
# Rodar:  docker run -p 8080:8080 -e TOTEM_KEY=... -e ADMIN_EMAILS=... ecotronic
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/ecotronic-api-1.0.0.jar app.jar
ENV H2_CONSOLE=false
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
