import { OperationAction } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { DeleteAccessLogSchema } from "../schemas/accessLog.schema";
import { AccessLogService } from "../services/accessLog";
import { checkUser } from "../services/checkUser";
import { StatusCode } from "../utils/appError";
import { convertNumericStrings } from "../utils/convertNumber";
import { convertStringToBoolean } from "../utils/convertStringToBoolean";
import { HttpDataResponse, HttpListResponse } from "../utils/helper";

const service = AccessLogService.new();

export async function getAccessLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // @ts-ignore  for mocha
    checkUser(req.user).ok_or_throw();

    const query = convertNumericStrings(req.query);

    const { id, browser, ip, platform, date } = query.filter ?? {};
    const { page, pageSize } = query.pagination ?? {};
    const { user } = convertStringToBoolean(query.include) ?? {};

    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Read,
    );
    _isAccess.ok_or_throw();

    const [count, logs] = (await service.tryFindManyWithCount(
      {
        pagination: { page, pageSize },
      },
      {
        where: {
          userId: sessionUser.isSuperuser ? undefined : sessionUser.id,
          id,
          browser,
          ip,
          platform,
          date,
        },
        include: {
          user,
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
    )).ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpListResponse(logs, count, {
        meta: {
          filter: { id, browser, ip, platform, date },
          include: { user },
          page,
          pageSize,
        },
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteAccessLogsHandler(
  req: Request<DeleteAccessLogSchema["params"]>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { accessLogId } = req.params;

    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Read,
    );
    _isAccess.ok_or_throw();

    const accessLog = (await service.tryDelete({
      where: {
        userId: sessionUser.isSuperuser ? undefined : sessionUser.id,
        id: accessLogId,
      },
    })).ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpDataResponse({ accessLog }, { meta: { id: accessLogId } }),
    );
  } catch (err) {
    next(err);
  }
}
