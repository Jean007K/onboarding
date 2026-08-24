FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN go mod download && CGO_ENABLED=0 GOOS=linux go build -o /out/server .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /out/server /app/server
RUN mkdir -p /data
ENV PORT=8080
ENV DB_PATH=/data/onboarding.db
EXPOSE 8080
CMD ["/app/server"]
