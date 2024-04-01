import { OperationAction } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import {
  CreateUserAddressInput,
  DeleteMultiUserAddressesInput,
  GetUserAddressInput,
  UpdateUserAddressInput,
} from "../schemas/userAddress.schema";
import { checkUser } from "../services/checkUser";
import { UserAddressService } from "../services/userAddresses";
import { StatusCode } from "../utils/appError";
import { convertNumericStrings } from "../utils/convertNumber";
import { convertStringToBoolean } from "../utils/convertStringToBoolean";
import {
  HttpDataResponse,
  HttpListResponse,
  HttpResponse,
} from "../utils/helper";

const service = UserAddressService.new();

export async function getUserAddressesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = convertNumericStrings(req.query);

    const {
      id,
      username,
      isDefault,
      phone,
      email,
      fullAddress,
      remark,
    } = query.filter ?? {};
    const { page, pageSize } = query.pagination ?? {};
    const {
      _count,
      region,
      user,
      township,
      deliveryOrders,
      deveryPotentialOrders,
      billingOrders,
      billingPotentialOrders,
    } = convertStringToBoolean(query.include) ?? {};
    const orderBy = query.orderBy ?? {};

    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Read,
    );
    _isAccess.ok_or_throw();

    const where = {
      id,
      username,
      userId: sessionUser.id,
      isDefault,
      phone,
      email,
      fullAddress,
      remark,
    };
    const include = {
      _count,
      region,
      user,
      township,
      deliveryOrders,
      deveryPotentialOrders,
      billingOrders,
      billingPotentialOrders,
    };

    const [count, userAddresses] = (await service.tryFindManyWithCount(
      {
        pagination: { page, pageSize },
      },
      {
        where,
        include,
        orderBy,
      },
    )).ok_or_throw();

    res.status(StatusCode.OK).json(HttpListResponse(userAddresses, count, {
      meta: {
        filter: where,
        include,
        page,
        pageSize,
      },
    }));
  } catch (err) {
    next(err);
  }
}

export async function getUserAddressHandler(
  req: Request<GetUserAddressInput["params"]>,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = convertNumericStrings(req.query);

    const { userAddressId } = req.params;
    const {
      _count,
      region,
      user,
      township,
      deliveryOrders,
      deveryPotentialOrders,
      billingOrders,
      billingPotentialOrders,
    } = convertStringToBoolean(query.include) ?? {};

    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Read,
    );
    _isAccess.ok_or_throw();

    const include = {
      _count,
      region,
      user,
      township,
      deliveryOrders,
      deveryPotentialOrders,
      billingOrders,
      billingPotentialOrders,
    };

    const userAddress = (await service.tryFindUnique({
      where: {
        id: userAddressId,
      },
      include,
    })).ok_or_throw()!;

    if (userAddress) {
      const _auditLog = await service.audit(sessionUser);
      _auditLog.ok_or_throw();
    }

    res.status(StatusCode.OK).json(
      HttpDataResponse({ userAddress }, {
        meta: {
          id: userAddress.id,
          include,
        },
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function createUserAddressHandler(
  req: Request<{}, {}, CreateUserAddressInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      username,
      isDefault,
      phone,
      email,
      regionId,
      townshipFeesId,
      fullAddress,
      remark,
    } = req.body;

    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Create,
    );
    _isAccess.ok_or_throw();

    const userAddress = (await service.tryCreate({
      data: {
        isDefault,
        username,
        phone,
        email,
        regionId,
        townshipFeesId,
        userId: sessionUser.id,
        fullAddress,
        remark,
      },
    })).ok_or_throw();

    // Create audit log
    const _auditLog = await service.audit(sessionUser);
    _auditLog.ok_or_throw();

    res.status(StatusCode.Created).json(
      HttpDataResponse({ userAddress }, { meta: { id: userAddress.id } }),
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteUserAddressHandler(
  req: Request<GetUserAddressInput["params"]>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userAddressId } = req.params;

    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Delete,
    );
    _isAccess.ok_or_throw();

    const userAddress = (await service.tryDelete({
      where: {
        id: userAddressId,
      },
    })).ok_or_throw();

    // Create audit log
    const _auditLog = await service.audit(sessionUser);
    _auditLog.ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpDataResponse({ userAddress }, { meta: { id: userAddress.id } }),
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteMultiUserAddressesHandler(
  req: Request<{}, {}, DeleteMultiUserAddressesInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userAddressIds } = req.body;

    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Delete,
    );
    _isAccess.ok_or_throw();

    const _deleteUserAddresses = await service.tryDeleteMany({
      where: {
        id: {
          in: userAddressIds,
        },
      },
    });
    _deleteUserAddresses.ok_or_throw();

    // Create audit log
    const _auditLog = await service.audit(sessionUser);
    _auditLog.ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpResponse(StatusCode.OK, "Success deleted"),
    );
  } catch (err) {
    next(err);
  }
}

export async function updateUserAddressHandler(
  req: Request<
    UpdateUserAddressInput["params"],
    {},
    UpdateUserAddressInput["body"]
  >,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userAddressId } = req.params;
    const data = req.body;

    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok_or_throw();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Update,
    );
    _isAccess.ok_or_throw();

    const userAddress = (await service.tryUpdate({
      where: {
        id: userAddressId,
      },
      data,
    })).ok_or_throw();

    // Create audit log
    const _auditLog = await service.audit(sessionUser);
    _auditLog.ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpDataResponse({ userAddress }, { meta: { id: userAddress.id } }),
    );
  } catch (err) {
    next(err);
  }
}
