import {
    HttpException,
    HttpStatus,
    Injectable,
    UnprocessableEntityException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UserRoleEnum } from './users.enum';
import { User } from './schemas';
import * as bcrypt from 'bcryptjs';
import type { NullableType } from '~be/common/utils/types';
import { convertToObjectId } from '~be/common/utils';
import { CreateUserDto } from './dtos';
import { Types } from 'mongoose';
// import { CreateUserDto, FilterUserDto, SortUserDto, UpdateUserMntDto } from './dtos';

@Injectable()
export class UsersService {
    constructor(public readonly usersRepository: UsersRepository) {}

    async create(createProfileDto: CreateUserDto): Promise<User> {
        const clonedPayload = {
            ...createProfileDto,
        };

        if (clonedPayload.password) {
            const salt = await bcrypt.genSalt();
            clonedPayload.password = await bcrypt.hash(clonedPayload.password, salt);
        }

        if (clonedPayload.email) {
            const userObject = await this.usersRepository.findOne({
                filterQuery: {
                    email: clonedPayload.email,
                },
            });
            if (userObject) {
                throw new HttpException(
                    {
                        status: HttpStatus.UNPROCESSABLE_ENTITY,
                        errors: {
                            email: 'emailAlreadyExists',
                        },
                    },
                    HttpStatus.UNPROCESSABLE_ENTITY,
                );
            }
        }

        // const roleOfUse = valuesOfEnum(UserRoleEnum).includes(clonedPayload.role);
        // if (!roleOfUse) {
        //     throw new HttpException(
        //         {
        //             status: HttpStatus.UNPROCESSABLE_ENTITY,
        //             errors: {
        //                 role: 'roleNotExists',
        //             },
        //         },
        //         HttpStatus.UNPROCESSABLE_ENTITY,
        //     );
        // }

        // if (clonedPayload.role === UserRoleEnum.Admin) {
        //     throw new HttpException(
        //         {
        //             status: HttpStatus.UNPROCESSABLE_ENTITY,
        //             errors: {
        //                 role: 'canNotBeManager',
        //             },
        //         },
        //         HttpStatus.UNPROCESSABLE_ENTITY,
        //     );
        // }
        // if (clonedPayload.role === UserRoleEnum.Customer && !isSocialAuth) {
        //     throw new HttpException(
        //         {
        //             status: HttpStatus.UNPROCESSABLE_ENTITY,
        //             errors: {
        //                 role: 'canNotBeCustomer',
        //             },
        //         },
        //         HttpStatus.UNPROCESSABLE_ENTITY,
        //     );
        // }

        const userCreated = await this.usersRepository.create({
            document: {
                ...clonedPayload,
                role: UserRoleEnum.Customer,
            },
        });
        return userCreated;
    }

    async findByEmail(email: string): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                email,
            },
        });
        return user ? new User(user) : null;
    }

    async update(
        userId: string | Types.ObjectId,
        payload: Partial<User>,
    ): Promise<NullableType<User>> {
        delete payload?.email;

        if (payload?.password) {
            const salt = await bcrypt.genSalt();
            payload.password = await bcrypt.hash(payload.password, salt);
        }

        const user = await this.usersRepository.findOneAndUpdate({
            filterQuery: {
                _id: convertToObjectId(userId),
            },
            updateQuery: {
                ...payload,
            },
        });
        return user ? new User(user) : null;
    }

    async findById(id: string | Types.ObjectId): Promise<NullableType<User>> {
        const user = await this.usersRepository.findOne({
            filterQuery: {
                _id: convertToObjectId(id),
            },
        });
        return user ? new User(user) : null;
    }

    async findByIdOrThrow(id: string | Types.ObjectId): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new UnprocessableEntityException({
                errors: {
                    email: 'notFound',
                },
                message: `User with email '${user.email}' is not found`,
            });
        }
        return user;
    }

    // async findBySocial(socialId: string, provider: AuthProviderEnum): Promise<NullableType<User>> {
    //     const user = await this.usersRepository.findOne({
    //         filterQuery: {
    //             socialId,
    //             provider,
    //         },
    //     });
    //     return user ? new User(user) : null;
    // }

    // async findManyWithPagination({
    //     filterOptions,
    //     sortOptions,
    //     paginationOptions,
    // }: {
    //     filterOptions?: FilterUserDto | null;
    //     sortOptions?: SortUserDto[] | null;
    //     paginationOptions: TPaginationOptions;
    // }): Promise<User[]> {
    //     return this.usersRepository.findManyWithPagination({
    //         filterOptions,
    //         sortOptions,
    //         paginationOptions,
    //     });
    // }

    // async updateUserMnt(
    //     targetUserId: string | Types.ObjectId,
    //     actorId: string | Types.ObjectId,
    //     payload: UpdateUserMntDto,
    // ) {
    //     // eslint-disable-next-line prefer-const
    //     let [targetUser, actor] = await Promise.all([
    //         this.usersRepository.findOneOrThrow({
    //             filterQuery: {
    //                 _id: convertToObjectId(targetUserId),
    //             },
    //         }),
    //         this.usersRepository.findOneOrThrow({
    //             filterQuery: {
    //                 _id: convertToObjectId(actorId),
    //             },
    //         }),
    //     ]);

    //     if (payload?.role) {
    //         targetUser = this.changeRole({
    //             targetUser,
    //             actor,
    //             role: payload.role,
    //         });
    //     }

    //     if (payload?.block) {
    //         switch (payload.block.action) {
    //             case UserBlockActionEnum.Block:
    //                 targetUser = this.updateUserBlockStatus({
    //                     targetUser,
    //                     actor,
    //                     block: payload.block,
    //                     isBlocked: true,
    //                     action: UserBlockActionEnum.Block,
    //                     selfBlockError: 'cannotBlockYourself',
    //                     permissionError: 'notAllowedToBlock',
    //                     alreadyBlockedError: 'userAlreadyBlocked',
    //                 });
    //                 break;
    //             case UserBlockActionEnum.Unblock:
    //                 targetUser = this.updateUserBlockStatus({
    //                     targetUser,
    //                     actor,
    //                     block: payload.block,
    //                     isBlocked: false,
    //                     action: UserBlockActionEnum.Unblock,
    //                     selfBlockError: 'cannotUnblockYourself',
    //                     permissionError: 'notAllowedToUnblock',
    //                     alreadyBlockedError: 'userAlreadyNotBlocked',
    //                 });
    //                 break;
    //             default:
    //                 break;
    //         }
    //     }
    //     await this.usersRepository.findOneAndUpdateOrThrow({
    //         filterQuery: {
    //             _id: convertToObjectId(targetUserId),
    //         },
    //         updateQuery: targetUser,
    //     });
    // }

    // public async isImageInUse(publicId: string): Promise<boolean> {
    //     return (await this.usersRepository.count({ 'avatar.publicId': publicId })) > 0;
    // }

    // private changeRole({
    //     targetUser,
    //     actor,
    //     role,
    // }: {
    //     targetUser: User;
    //     actor: User;
    //     role: UserRoleEnum;
    // }): User {
    //     if (targetUser._id === actor._id) {
    //         throw new HttpException(
    //             {
    //                 status: HttpStatus.UNPROCESSABLE_ENTITY,
    //                 errors: {
    //                     role: 'cannotChangeRoleOfYourself',
    //                 },
    //             },
    //             HttpStatus.UNPROCESSABLE_ENTITY,
    //         );
    //     }

    //     if (actor.role !== UserRoleEnum.Manager || targetUser.role === UserRoleEnum.Manager) {
    //         throw new HttpException(
    //             {
    //                 status: HttpStatus.UNPROCESSABLE_ENTITY,
    //                 errors: {
    //                     role: 'notAllowedToChangeRole',
    //                 },
    //             },
    //             HttpStatus.UNPROCESSABLE_ENTITY,
    //         );
    //     }

    //     if (targetUser?.role === role) {
    //         throw new HttpException(
    //             {
    //                 status: HttpStatus.UNPROCESSABLE_ENTITY,
    //                 errors: {
    //                     role: 'userAlreadyHasRole',
    //                 },
    //             },
    //             HttpStatus.UNPROCESSABLE_ENTITY,
    //         );
    //     }

    //     targetUser.role = role;
    //     return targetUser;
    // }

    // private updateUserBlockStatus({
    //     targetUser,
    //     actor,
    //     block: blockObject,
    //     isBlocked,
    //     action,
    //     selfBlockError,
    //     permissionError,
    //     alreadyBlockedError,
    // }: {
    //     targetUser: User;
    //     actor: User;
    //     block: UpdateUserMntDto['block'];
    //     isBlocked: boolean;
    //     action: UserBlockActionEnum;
    //     selfBlockError: string;
    //     permissionError: string;
    //     alreadyBlockedError: string;
    // }): User {
    //     if (targetUser._id === actor._id) {
    //         throw new HttpException(
    //             {
    //                 status: HttpStatus.UNPROCESSABLE_ENTITY,
    //                 errors: {
    //                     block: selfBlockError,
    //                 },
    //             },
    //             HttpStatus.UNPROCESSABLE_ENTITY,
    //         );
    //     }

    //     if (actor.role !== UserRoleEnum.Manager || targetUser.role === UserRoleEnum.Manager) {
    //         throw new HttpException(
    //             {
    //                 status: HttpStatus.UNPROCESSABLE_ENTITY,
    //                 errors: {
    //                     block: permissionError,
    //                 },
    //             },
    //             HttpStatus.UNPROCESSABLE_ENTITY,
    //         );
    //     }

    //     if (targetUser?.block?.isBlocked === isBlocked) {
    //         throw new HttpException(
    //             {
    //                 status: HttpStatus.UNPROCESSABLE_ENTITY,
    //                 errors: {
    //                     block: alreadyBlockedError,
    //                 },
    //             },
    //             HttpStatus.UNPROCESSABLE_ENTITY,
    //         );
    //     }

    //     const actLogs = targetUser?.block?.activityLogs || [];
    //     actLogs.push({
    //         action,
    //         actionAt: new Date(),
    //         actionBy: actor._id,
    //         reason: blockObject?.activityLogs.reason ?? '',
    //         note: blockObject?.activityLogs.note ?? '',
    //     });

    //     return Object.assign(targetUser, {
    //         block: {
    //             isBlocked,
    //             activityLogs: actLogs,
    //         },
    //     });
    // }
}
