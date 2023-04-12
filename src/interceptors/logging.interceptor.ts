import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const userAgent = context.switchToHttp().getRequest().headers[
            'user-agent'
        ];
        const request = context.switchToHttp().getRequest();
        const requestBody = context['args'][0].body;
        const params = context['args'][0].params;
        const query = context['args'][0].query;
        const method = request.method;
        const url = request.url;
        const now = Date.now();
        return next.handle().pipe(
            tap((data) => {
                console.log(
                    `Time ${Date.now() - now}ms`,
                    '\n',
                    `Request ${request}`,
                    '\n',
                    `Method ${method}`,
                    '\n',
                    `URL ${url}`,
                    '\n',
                    `Request Body ${JSON.stringify(requestBody)}`,
                    '\n',
                    `Request Params ${JSON.stringify(params)}`,
                    '\n',
                    `Request Query ${JSON.stringify(query)}`,
                    '\n',
                    `Response ${JSON.stringify(data)}`,
                    '\n',
                    `User Agent ${userAgent}`
                );
            }),
            catchError((error) => {
                console.log('error caught in interceptor', error);
                throw error;
            })
        );
    }
}
