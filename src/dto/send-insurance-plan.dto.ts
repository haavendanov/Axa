import { IsNumberString, IsString, IsEmail, IsArray } from 'class-validator';

export class SendInsurancePlanDto {
  @IsString() readonly first_name: string;
  @IsString() readonly last_name: string;
  @IsNumberString() readonly phone: string;
  @IsEmail() readonly email: string;
  @IsNumberString() readonly age: string;
  @IsString() readonly gender: string;
  @IsArray() readonly plans: Array<string>;
}