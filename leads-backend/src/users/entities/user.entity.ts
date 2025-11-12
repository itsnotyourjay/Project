import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  registeredAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // store when the user last logged in (set explicitly by the service)
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  // IP used for registration (optional)
  @Column({ nullable: true })
  registeredIp: string;

  // IP used for the most recent login (optional)
  @Column({ nullable: true })
  lastLoginIp: string;

  // hashed refresh token for rotating refresh-token strategy (optional)
  // refresh tokens are now stored in a separate table (refresh_tokens)
}
