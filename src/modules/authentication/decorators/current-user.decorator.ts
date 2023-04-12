import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator which provides the current user who is making the request
 */
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as any;
    }
);
