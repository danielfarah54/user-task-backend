import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";

import { User } from "./User";

@ObjectType()
@Entity("tasks")
export class Task extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ name: "user_id" })
  userId: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  description: string;

  @Field()
  @Column({ default: false })
  completed: boolean;

  @Field(() => User)
  user: User;

  @ManyToOne(() => User, (user) => user.taskConnection, {
    primary: true,
    onDelete: "CASCADE",
  })

  @JoinColumn({ name: "user_id" })
  userConnection: Promise<User>;
}
