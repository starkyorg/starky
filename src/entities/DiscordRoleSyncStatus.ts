import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('discord_role_sync_status')
@Unique(['discordMemberId', 'discordServerConfigId'])
export class DiscordRoleSyncStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  discordMemberId: string;

  @Column()
  discordServerConfigId: string;

  @Column()
  shouldHaveRole: boolean;

  @Column({ type: 'timestamp' })
  date: Date;
}
