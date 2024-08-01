import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt'
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class RegisterService {
    constructor(private readonly prisma: PrismaService) { }

    //Register a new user
    async register(createUserDto: CreateUserDto) {
        const { username, password } = createUserDto;

        //Check if the user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { username },
        });
        if (existingUser) {
            throw new Error('User already exists');
        }
        //Hash the password
        const hashedPassword = await bcrypt.hash(password , 10);
        //Create the user
        const user = await this.prisma.user.create({
            data:{
                username,
                password: hashedPassword,
            },
        });
        return user;
    }

    //Fetch all users
    async getAllUsers() {
        return this.prisma.user.findMany({
            include: {
                role: true, // Include role information
            },
        });
    }
    // Update user details
    async updateUser(updateUserDto: UpdateUserDto) {
        const { id, username, roleId } = updateUserDto;
        // Find and update the user
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                username: username ?? undefined,
                roleId: roleId ?? undefined,
                isSeller: roleId === 3 ? true : undefined,
            },
        });
        return updatedUser;
    }

    // Delete a user by ID
    async deleteUser(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.delete({
            where: { id: userId },
        });

        return { message: 'User deleted successfully' };
    }
}
