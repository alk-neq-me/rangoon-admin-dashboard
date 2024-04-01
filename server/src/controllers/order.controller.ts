import AppError, { StatusCode } from "../utils/appError";

import { OperationAction } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import {
  CreateOrderInput,
  DeleteMultiOrdersInput,
  GetOrderInput,
  UpdateOrderInput,
} from "../schemas/order.schema";
import { checkUser } from "../services/checkUser";
import { OrderService } from "../services/order";
import {
  LifeCycleOrderConcrate,
  LifeCycleState,
} from "../utils/auth/life-cycle-state";
import { convertNumericStrings } from "../utils/convertNumber";
import { convertStringToBoolean } from "../utils/convertStringToBoolean";
import { db } from "../utils/db";
import {
  HttpDataResponse,
  HttpListResponse,
  HttpResponse,
} from "../utils/helper";

const service = OrderService.new();

export async function getOrdersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = convertNumericStrings(req.query);

    const { id, startDate, endDate, status, totalPrice, remark } =
      query.filter ?? {};
    const { page, pageSize } = query.pagination ?? {};
    const {
      _count,
      user,
      orderItems,
      pickupAddress,
      billingAddress,
      deliveryAddress,
    } = convertStringToBoolean(query.include) ?? {};
    const orderBy = query.orderBy ?? {};

    const sessionUser = checkUser(req?.user).ok();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Read,
    );
    _isAccess.ok_or_throw();

    const [count, orders] = (await service.tryFindManyWithCount(
      {
        pagination: { page, pageSize },
      },
      {
        where: {
          id,
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
          status,
          totalPrice,
          remark,
        },
        include: {
          _count,
          user,
          orderItems,
          pickupAddress,
          billingAddress,
          deliveryAddress,
        },
        orderBy,
      },
    )).ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpListResponse(orders, count, {
        meta: {
          filter: { id, startDate, endDate, status, totalPrice, remark },
          include: {
            _count,
            user,
            orderItems,
            pickupAddress,
            billingAddress,
            deliveryAddress,
          },
          page,
          pageSize,
        },
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getOrderHandler(
  req: Request<GetOrderInput["params"]>,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = convertNumericStrings(req.query);

    const { orderId } = req.params;
    const {
      _count,
      user,
      orderItems,
      pickupAddress,
      billingAddress,
      deliveryAddress,
    } = convertStringToBoolean(query.include) ?? {};

    const sessionUser = checkUser(req?.user).ok();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Read,
    );
    _isAccess.ok_or_throw();

    const order = (await service.tryFindUnique({
      where: { id: orderId },
      include: {
        _count,
        user,
        orderItems,
        pickupAddress,
        billingAddress,
        deliveryAddress,
      },
    })).ok_or_throw()!;

    // Create audit log
    if (order && sessionUser) {
      (await service.audit(sessionUser)).ok_or_throw();
    }

    res.status(StatusCode.OK).json(
      HttpDataResponse({ order }, {
        meta: {
          id: order.id,
          include: {
            _count,
            user,
            orderItems,
            pickupAddress,
            billingAddress,
            deliveryAddress,
          },
        },
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function createOrderHandler(
  req: Request<{}, {}, CreateOrderInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      orderItems,
      totalPrice,
      addressType,
      deliveryAddressId,
      billingAddressId,
      pickupAddressId,
      status,
      paymentMethodProvider,
      remark,
    } = req.body;

    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Create,
    );
    _isAccess.ok_or_throw();

    const userId = sessionUser?.id;

    const order = (await service.tryCreate({
      data: {
        addressType,
        orderItems: {
          connect: await Promise.all(orderItems.map(async id => {
            const _orderItem = await db.orderItem.findUnique({
              where: { id },
              include: {
                product: { select: { id: true, quantity: true } },
              },
            });
            if (!_orderItem?.product) {
              return Promise.reject(
                AppError.new(
                  StatusCode.NotFound,
                  `Error: Product not found in cart. This item may have been deleted or is no longer available.`,
                ),
              );
            }

            await db.product.update({
              where: { id: _orderItem.product.id },
              data: {
                quantity: {
                  decrement: _orderItem.quantity,
                },
              },
            });

            return { id };
          })),
        },
        userId,
        totalPrice,
        status,
        deliveryAddressId,
        billingAddressId,
        pickupAddressId,
        paymentMethodProvider,
        remark,
      },
    })).ok_or_throw();

    // Create audit log
    if (sessionUser) (await service.audit(sessionUser)).ok_or_throw();

    res.status(StatusCode.Created).json(
      HttpDataResponse({ order }, { meta: { id: order.id } }),
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteOrderHandler(
  req: Request<GetOrderInput["params"]>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { orderId } = req.params;

    const sessionUser = checkUser(req?.user).ok();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Delete,
    );
    _isAccess.ok_or_throw();

    const order = (await service.tryDelete({
      where: {
        id: orderId,
      },
    })).ok_or_throw();

    // Create audit log
    const _auditLog = await service.audit(sessionUser);
    _auditLog.ok_or_throw();

    res.status(StatusCode.OK).json(
      HttpDataResponse({ order }, { meta: { id: order.id } }),
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteMultiOrdersHandler(
  req: Request<{}, {}, DeleteMultiOrdersInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { orderIds } = req.body;

    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Delete,
    );
    _isAccess.ok_or_throw();

    const _deletedOrders = await service.tryDeleteMany({
      where: {
        id: {
          in: orderIds,
        },
      },
    });
    _deletedOrders.ok_or_throw();

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

export async function updateOrderHandler(
  req: Request<UpdateOrderInput["params"], {}, UpdateOrderInput["body"]>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { orderId } = req.params;
    const data = req.body;

    const originalOrderState = (await service.tryFindUnique({
      where: { id: orderId },
      select: { status: true },
    })).ok_or_throw();

    if (!originalOrderState) {
      return next(AppError.new(StatusCode.NotFound, `Order not found`));
    }

    const orderLifeCycleState = new LifeCycleState<LifeCycleOrderConcrate>(
      {
        resource: "order",
        state: originalOrderState.status,
      },
    );
    const orderState = orderLifeCycleState.changeState(data.status);

    // @ts-ignore  for mocha testing
    const sessionUser = checkUser(req?.user).ok();
    const _isAccess = await service.checkPermissions(
      sessionUser,
      OperationAction.Update,
    );
    _isAccess.ok_or_throw();

    const order = (await service.tryUpdate({
      where: {
        id: orderId,
      },
      data: {
        totalPrice: data.totalPrice,
        addressType: data.addressType,
        status: orderState,
        deliveryAddressId: data.deliveryAddressId,
        billingAddressId: data.billingAddressId,
        pickupAddressId: data.pickupAddressId,
        paymentMethodProvider: data.paymentMethodProvider,
        remark: data.remark,
      },
    })).ok_or_throw();

    // Create audit log
    if (sessionUser) {
      const _auditLog = await service.audit(sessionUser);
      _auditLog.ok_or_throw();
    }

    res.status(StatusCode.OK).json(
      HttpDataResponse({ order }, { meta: { id: order.id } }),
    );
  } catch (err: any) {
    next(err);
  }
}
