import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { compare, hash } from "bcrypt";
import { getConnection } from "typeorm";

import { createRefreshToken, createAccessToken } from "./auth";
import { isAuth } from "./isAuth";
import { MyContext } from "./MyContext";
import { sendRefreshToken } from "./sendRefreshToken";
import { User } from "./entity/User";

@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string;

  @Field()
  expiresIn: string;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  async users() {
    return await User.find();
  }

  @Query(() => [User])
  async emails(@Arg("email") email: string) {
    return await User.find({ email });
  }

  @UseMiddleware(isAuth)
  @Query(() => User)
  async user(@Ctx() { payload }: MyContext) {
    let user = null;
    try {
      user = await User.findOneOrFail({ id: parseFloat(payload!.userId) });
    } catch (error) {
      console.log(error);
      throw new Error("could not find user");
    }
    return user;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(@Ctx() { payload }: MyContext) {
    await getConnection()
      .getRepository(User)
      .increment({ id: parseFloat(payload!.userId) }, "tokenVersion", 1);

    return true;
  }

  @Mutation(() => Boolean)
  async registerUser(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Arg("name") name: string
  ) {
    const hashedPassword = await hash(password, 12);

    if (await User.findOne({ email })) {
      throw new Error("email already exists in database");
    }

    try {
      await User.insert({
        name,
        email,
        password: hashedPassword,
      });
    } catch (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async updateUser(
    @Arg("email") email: string,
    @Arg("name") name: string,
    @Ctx() { payload }: MyContext
  ) {
    const user = await User.findOne({ id: parseFloat(payload!.userId) });
    if (!user) {
      throw new Error("user not found");
    }

    try {
      await User.update(payload!.userId, {
        name,
        email,
      });
    } catch (error) {
      console.error(error);
      throw new Error("fail to update user");
    }

    return true;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async deleteUser(@Ctx() { payload }: MyContext) {
    const user = await User.findOne({ id: parseFloat(payload!.userId) });
    if (!user) {
      throw new Error("user not found");
    }

    try {
      await User.delete(payload!.userId);
    } catch (error) {
      console.error(error);
      throw new Error("fail to delete user");
    }

    return true;
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("could not find user");
    }

    const valid = await compare(password, user.password);

    if (!valid) {
      throw new Error("invalid password");
    }

    // login successful

    sendRefreshToken(res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
      expiresIn: "900",
    };
  }
}
