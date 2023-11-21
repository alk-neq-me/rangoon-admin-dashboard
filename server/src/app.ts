import { resolve } from 'path';
import dotenv from 'dotenv'

const env = process.env.NODE_ENV || "development"
const path = env === "development"
  ? resolve(__dirname, "../.env")
  : resolve(__dirname, `../.${env}.env`)

dotenv.config({ path })


import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'

import validateEnv from './utils/validateEnv'
import getConfig from './utils/getConfig'
import cookieParser from 'cookie-parser'
import AppError, { errorHandler } from './utils/appError'
import logging, { loggingMiddleware } from './middleware/logging/logging'
import redisClient from './utils/connectRedis'

import authRouter from './routers/auth.route'
import meRouter from './routers/me.route'
import userRouter from './routers/user.route'

import helmet from 'helmet';
import { rateLimitMiddleware } from './middleware/rateLimit';


validateEnv()


export const app = express()

/* Middlewares */
// CORS
app.use(cors({
  origin: getConfig("origin"),
  credentials: true,
}))

// Static
app.use("/img", express.static("public"))

// Helmet
app.use(helmet())

// Body parser (Build-in middlewares)
app.use(express.json({
  limit: '10kb' 
}))

// Cookie parser
app.use(cookieParser())

// Rate limit
app.use(rateLimitMiddleware)

// Logger
if (process.env.NODE_ENV === "development") app.use(loggingMiddleware)

// Cookie parser
app.use(cookieParser())


/* Routers */
app.get("/ping", async (_req: Request, res: Response, _next: NextFunction) => {
  res.status(200)
    .json({ ping: "PONG" })
})

app.get("/healthcheck", async (_: Request, res: Response, next: NextFunction) => {
  await redisClient.get("try")
    .then((message) => res.status(200).json({ message }))
    .catch(errorHandler(500, next));
})

app.use("/api/v1/auth", authRouter)
app.use("/api/v1/me", meRouter)
app.use("/api/v1/users", userRouter)


// Unhandled Route
app.all("*", (req: Request, _: Response, next: NextFunction) => {
  next(new AppError(404, `Route ${req.originalUrl} not found`))
})

// Global error handler
app.use(
  (error: AppError, _req: Request, res: Response, _next: NextFunction) => {
    error.status = error.status || 500;

    res.status(error.status).json({
      status: error.status,
      message: error.message
    })
  }
)

const port = getConfig("port") || 8000;

if (require.main === module) {
  const server = app.listen(port, () => {
    logging.log("Server is running on port", port)
  })

  process.on("SIGINT", () => {
    console.log("\n")
    logging.info("Received SIGINT. Closing server and Redis connection...")
    server.close(() => {
      redisClient.quit()
      process.exit(0)
    })
  })
}
