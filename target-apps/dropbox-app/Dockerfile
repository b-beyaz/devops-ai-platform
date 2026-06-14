FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .

RUN mvn dependency:go-offline -B -e

COPY src ./src
RUN mvn clean package -DskipTests -B -e

FROM eclipse-temurin:21-jre

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

RUN mkdir -p /app/uploads && chown appuser:appgroup /app/uploads



COPY --from=build /app/target/*.jar app.jar
RUN chown appuser:appgroup app.jar

USER appuser

EXPOSE 8085

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]