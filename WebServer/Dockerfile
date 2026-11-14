FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG VITE_BASE=/
ENV VITE_BASE=$VITE_BASE
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 7860

CMD ["nginx", "-g", "daemon off;"]
