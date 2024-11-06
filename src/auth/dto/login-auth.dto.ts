import { IsEmail, IsNotEmpty } from "class-validator";

export class LoginDto {
    @IsEmail({}, { message: 'El correo electrónico no es válido.' })
    @IsNotEmpty({ message: 'El correo electrónico es requerido.' })
    email: string;

    @IsNotEmpty({ message: 'La contraseña es requerida.' })
    password: string;
}
