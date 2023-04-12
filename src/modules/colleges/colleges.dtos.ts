import {
    IsNotEmpty,
    IsUUID,
} from 'class-validator';

export type CollegesList = College[];

export class College {
    @IsNotEmpty()
    @IsUUID('4')
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

export class ErrorDto {
    success: boolean;
    code: number;
    text: string;
}