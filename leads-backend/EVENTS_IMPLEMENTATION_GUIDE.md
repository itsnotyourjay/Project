# 🎯 NestJS Events - Implementation Guide for Your System

## What Are Events?

Events are a way for different parts of your app to communicate **without tight coupling**. When something happens (like a user logs in), you "emit" an event, and other parts of your app can "listen" and react.

### Benefits:
- ✅ **Loose Coupling** - Services don't need to know about each other
- ✅ **Easy to Extend** - Add new features without modifying existing code
- ✅ **Better Testing** - Test each listener independently
- ✅ **Async Operations** - Non-critical tasks don't block main flow
- ✅ **Audit Trail** - Automatically log all important actions

---

## Installation

Already done! ✅ `@nestjs/event-emitter@1.3.0` is installed (compatible with NestJS v7)

---

## Real-World Use Cases for Your System

### 1. **User Registration**
**Current:** Registration creates user, generates tokens
**With Events:** Registration emits `user.registered` event → listeners can:
- Send welcome email
- Log registration to audit trail
- Update analytics/stats
- Notify admins of new user
- Create default user preferences

### 2. **User Login**
**Current:** Login validates credentials, updates last login
**With Events:** Login emits `user.logged_in` event → listeners can:
- Update last login timestamp
- Check for suspicious login (new location/device)
- Send security notification email
- Log login attempts for security audit
- Update user activity stats

### 3. **Lead Creation**
**Current:** Lead is created and saved
**With Events:** Lead creation emits `lead.created` event → listeners can:
- Send email notification to user
- Notify admin of new lead
- Update lead statistics
- Trigger CRM integration
- Log to audit trail

### 4. **User Deletion**
**Current:** User and their data is deleted
**With Events:** Deletion emits `user.deleted` event → listeners can:
- Send goodbye email
- Archive user data for GDPR compliance
- Update statistics
- Revoke all user tokens
- Log deletion in audit trail

### 5. **Token Refresh**
**Current:** New tokens generated, old ones revoked
**With Events:** Refresh emits `token.refreshed` event → listeners can:
- Detect suspicious refresh patterns
- Update device metadata
- Clean up old revoked tokens
- Monitor token usage

---

## Step-by-Step Implementation

### Step 1: Update app.module.ts

Add EventEmitterModule to your main module:

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
// ... other imports

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),  // ← ADD THIS
    TypeOrmModule.forRoot({
      // ... your database config
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

### Step 2: Create Event DTOs

Create a folder for event definitions:

```typescript
// src/events/user.events.ts
export class UserRegisteredEvent {
  userId: number;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;

  constructor(partial: Partial<UserRegisteredEvent>) {
    Object.assign(this, partial);
  }
}

export class UserLoggedInEvent {
  userId: number;
  email: string;
  isAdmin: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  timestamp: Date;

  constructor(partial: Partial<UserLoggedInEvent>) {
    Object.assign(this, partial);
  }
}

export class UserDeletedEvent {
  userId: number;
  email: string;
  deletedBy: number;
  reason?: string;
  timestamp: Date;

  constructor(partial: Partial<UserDeletedEvent>) {
    Object.assign(this, partial);
  }
}

export class UserUpdatedEvent {
  userId: number;
  updatedBy: number;
  changes: Record<string, any>;
  timestamp: Date;

  constructor(partial: Partial<UserUpdatedEvent>) {
    Object.assign(this, partial);
  }
}
```

```typescript
// src/events/lead.events.ts
export class LeadCreatedEvent {
  leadId: number;
  userId: number;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  timestamp: Date;

  constructor(partial: Partial<LeadCreatedEvent>) {
    Object.assign(this, partial);
  }
}

export class LeadDeletedEvent {
  leadId: number;
  userId: number;
  deletedBy: number;
  reason?: string;
  timestamp: Date;

  constructor(partial: Partial<LeadDeletedEvent>) {
    Object.assign(this, partial);
  }
}
```

```typescript
// src/events/auth.events.ts
export class TokenRefreshedEvent {
  userId: number;
  oldTokenId: string;
  newTokenId: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;

  constructor(partial: Partial<TokenRefreshedEvent>) {
    Object.assign(this, partial);
  }
}
```

### Step 3: Emit Events from Services

Update your services to emit events:

```typescript
// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRegisteredEvent, UserLoggedInEvent } from '../events/user.events';
import { TokenRefreshedEvent } from '../events/auth.events';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private refreshTokensService: RefreshTokensService,
    private eventEmitter: EventEmitter2,  // ← INJECT EVENT EMITTER
  ) {}

  async register(dto: RegisterUserDto, ipAddress?: string, userAgent?: string) {
    const user = await this.users.create(dto, ipAddress);
    const tokens = await this.getTokens(user.id, user.email, user.isAdmin || false);

    // Store refresh token
    const hashed = await bcrypt.hash(tokens.refresh_token, 10);
    const deviceType = this.parseUserAgent(userAgent);
    await this.refreshTokensService.create({
      user_id: user.id,
      token_hash: hashed,
      expires_at: new Date(Date.now() + 604800000),
      device_type: deviceType,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // ✨ EMIT EVENT
    this.eventEmitter.emit(
      'user.registered',
      new UserRegisteredEvent({
        userId: user.id,
        email: user.email,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      }),
    );

    return { user, access_token: tokens.access_token, refresh_token: tokens.refresh_token };
  }

  async login(dto: LoginUserDto, ipAddress?: string, userAgent?: string) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.getTokens(user.id, user.email, user.isAdmin || false);
    const deviceType = this.parseUserAgent(userAgent);

    // Store refresh token
    const hashed = await bcrypt.hash(tokens.refresh_token, 10);
    await this.refreshTokensService.create({
      user_id: user.id,
      token_hash: hashed,
      expires_at: new Date(Date.now() + 604800000),
      device_type: deviceType,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    // ✨ EMIT EVENT
    this.eventEmitter.emit(
      'user.logged_in',
      new UserLoggedInEvent({
        userId: user.id,
        email: user.email,
        isAdmin: user.isAdmin || false,
        ipAddress,
        userAgent,
        deviceType,
        timestamp: new Date(),
      }),
    );

    return { user, access_token: tokens.access_token, refresh_token: tokens.refresh_token };
  }

  async refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string) {
    // ... existing token refresh logic ...
    
    // After successful refresh:
    this.eventEmitter.emit(
      'token.refreshed',
      new TokenRefreshedEvent({
        userId: user.id,
        oldTokenId: matched.id,
        newTokenId: newRow.id,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      }),
    );

    return { access_token: tokens.access_token, refresh_token: tokens.refresh_token };
  }
}
```

```typescript
// src/leads/leads.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeadCreatedEvent, LeadDeletedEvent } from '../events/lead.events';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead) private repo: Repository<Lead>,
    private eventEmitter: EventEmitter2,  // ← INJECT EVENT EMITTER
  ) {}

  async create(dto: CreateLeadDto, userId: number): Promise<Lead> {
    const lead = this.repo.create({ ...dto, user_id: userId });
    const savedLead = await this.repo.save(lead);

    // ✨ EMIT EVENT
    this.eventEmitter.emit(
      'lead.created',
      new LeadCreatedEvent({
        leadId: savedLead.id,
        userId,
        name: savedLead.name,
        email: savedLead.email,
        phone: savedLead.phone,
        message: savedLead.message,
        timestamp: new Date(),
      }),
    );

    return savedLead;
  }

  async remove(id: number, deletedBy: number): Promise<void> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('Lead not found');

    await this.repo.delete(id);

    // ✨ EMIT EVENT
    this.eventEmitter.emit(
      'lead.deleted',
      new LeadDeletedEvent({
        leadId: id,
        userId: lead.user_id,
        deletedBy,
        timestamp: new Date(),
      }),
    );
  }
}
```

### Step 4: Create Event Listeners

Create a listeners module to handle events:

```typescript
// src/listeners/user.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegisteredEvent, UserLoggedInEvent, UserDeletedEvent } from '../events/user.events';
import { UsersService } from '../users/users.service';

@Injectable()
export class UserListener {
  private readonly logger = new Logger(UserListener.name);

  constructor(private usersService: UsersService) {}

  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent) {
    this.logger.log(`✅ New user registered: ${event.email} (ID: ${event.userId})`);
    this.logger.log(`   📍 IP: ${event.ipAddress}, 📱 Device: ${event.userAgent?.substring(0, 50)}`);
    
    // TODO: Send welcome email
    // await this.emailService.sendWelcomeEmail(event.email);
    
    // TODO: Create default user settings
    // await this.settingsService.createDefaults(event.userId);
  }

  @OnEvent('user.logged_in')
  async handleUserLoggedIn(event: UserLoggedInEvent) {
    this.logger.log(`🔐 User logged in: ${event.email} (ID: ${event.userId})`);
    this.logger.log(`   👤 Admin: ${event.isAdmin}, 📍 IP: ${event.ipAddress}`);
    
    // Update last login timestamp
    await this.usersService.updateLastLogin(event.userId, event.ipAddress);
    
    // TODO: Check for suspicious login (different country, new device, etc.)
    // TODO: Send security notification if needed
  }

  @OnEvent('user.deleted')
  async handleUserDeleted(event: UserDeletedEvent) {
    this.logger.warn(`⚠️  User deleted: ${event.email} (ID: ${event.userId})`);
    this.logger.warn(`   🗑️  Deleted by: ${event.deletedBy}, Reason: ${event.reason || 'N/A'}`);
    
    // TODO: Send goodbye email
    // TODO: Archive user data
    // TODO: Clean up related resources
  }
}
```

```typescript
// src/listeners/lead.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeadCreatedEvent, LeadDeletedEvent } from '../events/lead.events';

@Injectable()
export class LeadListener {
  private readonly logger = new Logger(LeadListener.name);

  @OnEvent('lead.created')
  async handleLeadCreated(event: LeadCreatedEvent) {
    this.logger.log(`📝 New lead created: ${event.name} (${event.email})`);
    this.logger.log(`   👤 User ID: ${event.userId}, Lead ID: ${event.leadId}`);
    
    // TODO: Send notification to user
    // TODO: Notify admin of new lead
    // TODO: Update lead statistics
  }

  @OnEvent('lead.deleted')
  async handleLeadDeleted(event: LeadDeletedEvent) {
    this.logger.log(`🗑️  Lead deleted: ID ${event.leadId}`);
    this.logger.log(`   Deleted by user: ${event.deletedBy}`);
    
    // TODO: Archive lead data
    // TODO: Update statistics
  }
}
```

```typescript
// src/listeners/auth.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TokenRefreshedEvent } from '../events/auth.events';

@Injectable()
export class AuthListener {
  private readonly logger = new Logger(AuthListener.name);

  @OnEvent('token.refreshed')
  async handleTokenRefreshed(event: TokenRefreshedEvent) {
    this.logger.debug(`🔄 Token refreshed for user ${event.userId}`);
    this.logger.debug(`   Old token: ${event.oldTokenId}, New token: ${event.newTokenId}`);
    
    // TODO: Detect suspicious refresh patterns
    // TODO: Clean up old revoked tokens periodically
  }
}
```

### Step 5: Create Listeners Module

```typescript
// src/listeners/listeners.module.ts
import { Module } from '@nestjs/common';
import { UserListener } from './user.listener';
import { LeadListener } from './lead.listener';
import { AuthListener } from './auth.listener';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],  // Import modules that listeners need
  providers: [
    UserListener,
    LeadListener,
    AuthListener,
  ],
})
export class ListenersModule {}
```

### Step 6: Register Listeners Module

```typescript
// src/app.module.ts
import { ListenersModule } from './listeners/listeners.module';

@Module({
  imports: [
    // ... existing imports
    EventEmitterModule.forRoot(),
    ListenersModule,  // ← ADD THIS
  ],
})
export class AppModule {}
```

---

## Testing Events

After implementing, you should see console logs when events fire:

```bash
[UserListener] ✅ New user registered: test@example.com (ID: 22)
[UserListener]    📍 IP: ::1, 📱 Device: Mozilla/5.0 (Macintosh...
[UserListener] 🔐 User logged in: test@example.com (ID: 22)
[UserListener]    👤 Admin: false, 📍 IP: ::1
[LeadListener] 📝 New lead created: John Doe (john@example.com)
[LeadListener]    👤 User ID: 22, Lead ID: 45
```

---

## Advanced: Async Event Handling

For non-critical tasks (like sending emails), make listeners async to not block the main flow:

```typescript
@OnEvent('user.registered', { async: true })  // ← Runs in background
async handleUserRegistered(event: UserRegisteredEvent) {
  // This won't block registration response
  await this.emailService.sendWelcomeEmail(event.email);
}
```

---

## Summary

**Events allow you to:**
1. ✅ Keep services focused (single responsibility)
2. ✅ Add features without modifying existing code
3. ✅ Log all important actions automatically
4. ✅ Send emails/notifications without blocking responses
5. ✅ Build audit trails for security/compliance
6. ✅ Test each feature independently

**Your supervisor asked about events because they're essential for:**
- **Scalable applications** - Easy to add new features
- **Maintainable code** - Less coupling between services
- **Production systems** - Audit logging, monitoring, notifications
- **Modern architectures** - Microservices, CQRS, Event Sourcing
