# ---------- Build Stage ----------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Accept build argument
ARG REACT_APP_VERSION
ENV REACT_APP_VERSION=$REACT_APP_VERSION

RUN npm run build

# ---------- Production Stage ----------
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
