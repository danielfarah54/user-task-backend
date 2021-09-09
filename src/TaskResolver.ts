import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";

import { isAuth } from "./isAuth";
import { MyContext } from "./MyContext";
import { Task } from "./entity/Task";

@Resolver()
export class TaskResolver {
  @UseMiddleware(isAuth)
  @Query(() => [Task])
  async tasks(@Ctx() { payload }: MyContext) {
    const userId = payload!.userId;
    if (!userId) {
      throw new Error("not authenticated");
    }
    return await Task.find({ userId: parseFloat(userId) });
  }

  @UseMiddleware(isAuth)
  @Query(() => Task)
  async task(@Arg("id") taskId: number, @Ctx() { payload }: MyContext) {
    let task = null;
    try {
      task = await Task.findOneOrFail({
        id: taskId,
        userId: parseFloat(payload!.userId),
      });
    } catch (error) {
      console.log(error);
      throw new Error("could not find task");
    }
    return task;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async registerTask(
    @Arg("description") description: string,
    @Arg("name") name: string,
    @Ctx() { payload }: MyContext
  ) {
    try {
      await Task.insert({
        description,
        name,
        userId: parseFloat(payload!.userId),
      });
    } catch (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async updateTask(
    @Arg("id") id: number,
    @Arg("description") description: string,
    @Arg("name") name: string,
    @Ctx() { payload }: MyContext
  ) {
    const task = await Task.findOne({
      id,
      userId: parseFloat(payload!.userId),
    });
    if (!task) {
      throw new Error("task not found");
    }

    try {
      await Task.update(id, {
        name,
        description,
      });
    } catch (error) {
      console.error(error);
      throw new Error("fail to update task");
    }

    return true;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async deleteTask(@Arg("id") id: number, @Ctx() { payload }: MyContext) {
    const task = await Task.findOne({
      id,
      userId: parseFloat(payload!.userId),
    });
    if (!task) {
      throw new Error("task not found");
    }

    try {
      await Task.delete(id);
    } catch (error) {
      console.error(error);
      throw new Error("fail to delete task");
    }

    return true;
  }
}
