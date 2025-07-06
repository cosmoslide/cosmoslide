# TODO.md

## Status Legend
- [x] Done
- [ ] Backlog

## Core Social Features

### Following System
- [x] Follow entity and relationships
- [ ] Follow/unfollow API endpoints
- [ ] Follow request management (for private accounts)
- [ ] Mutual follow detection
- [ ] Follow recommendations
- [ ] Followers/following counts

### Content Interactions
- [x] Create posts (notes)
- [x] View posts
- [ ] Like/unlike posts
- [ ] Reply to posts (threading)
- [ ] Delete own posts
- [ ] Edit posts
- [ ] Bookmark posts
- [ ] Share post URLs

### Timeline Features
- [x] User timeline (own posts)
- [ ] Home timeline (posts from followed users)
- [ ] Timeline pagination
- [ ] Timeline filters (media only, no replies, etc.)
- [ ] Infinite scroll
- [ ] Pull to refresh

### Notifications
- [ ] New follower notifications
- [ ] Mention notifications
- [ ] Like notifications
- [ ] Reply notifications
- [ ] Notification read/unread status
- [ ] Notification preferences

## Enhanced Features

### User Features
- [x] User registration
- [x] User authentication (magic link)
- [x] Basic user profile
- [ ] Profile editing (bio, display name, avatar, header)
- [ ] Account privacy settings (public/private)
- [ ] Pinned posts
- [ ] User verification badges
- [ ] Profile views counter

### Content Features
- [ ] Media attachments (images, videos)
- [ ] Multiple media per post
- [ ] Media gallery view
- [ ] Hashtag support
- [ ] Mentions (@username)
- [ ] Post visibility levels (public, followers, mentioned)
- [ ] Content warnings/sensitive content

### Discovery
- [ ] User search
- [ ] Post search
- [ ] Hashtag search
- [ ] Trending hashtags
- [ ] Suggested users to follow
- [ ] Explore/discover page

## Frontend Implementation

### Pages
- [x] Home page
- [x] Sign in page
- [x] Sign up page
- [x] Dashboard
- [x] User profile page (basic)
- [ ] Followers/following lists
- [ ] Notifications page
- [ ] Search page
- [ ] Explore/discover page
- [ ] Settings page
- [ ] Individual post view with replies
- [ ] Hashtag timeline page

### User Interface
- [x] Post creation form
- [x] Post display component
- [ ] Follow/unfollow buttons with loading states
- [ ] Like buttons with animation
- [ ] Reply interface with threading
- [ ] Share menu (copy link, share to...)
- [ ] User hover cards
- [ ] Mention autocomplete
- [ ] Hashtag autocomplete
- [ ] Image lightbox viewer

### Real-time Features
- [ ] Real-time notification badge
- [ ] Live timeline updates
- [ ] Typing indicators for replies
- [ ] Online status indicators

## Additional Features

### Email Service
- [x] Email service structure
- [ ] Implement actual email sending (currently console.log only)
- [ ] Welcome emails
- [ ] Notification emails (optional)
- [ ] Password reset emails
- [ ] Email verification

### Messaging
- [ ] Direct messages
- [ ] Message threads
- [ ] Unread message count
- [ ] Message notifications

### User Management
- [ ] Block users
- [ ] Mute users
- [ ] Report users/content
- [ ] User lists/groups
- [ ] Close friends feature

### Content Management
- [ ] Draft posts
- [ ] Scheduled posts
- [ ] Post analytics (views, engagement)
- [ ] Polls
- [ ] Stories/temporary posts

## Infrastructure

### Performance
- [ ] Image optimization and thumbnails
- [ ] Lazy loading for images
- [ ] Caching layer (Redis)
- [ ] Database query optimization
- [ ] CDN for media files

### Moderation & Safety
- [ ] Content reporting system
- [ ] Automated spam detection
- [ ] Word filters
- [ ] Admin dashboard
- [ ] User suspension/banning

## Federation Support

### ActivityPub Implementation
- [x] Basic ActivityPub structure
- [x] Actor endpoints
- [x] Keypair generation for actors
- [ ] Implement `handleFollow()` in `activity.handler.ts`
- [ ] Implement `handleUndo()` for unfollowing
- [ ] Implement `handleUpdate()` for profile/note updates
- [ ] Implement `handleDelete()` for content deletion
- [ ] Implement `handleLike()` for favorites
- [ ] Implement `handleAnnounce()` for boosts

### Federation Features
- [x] Local actor creation
- [x] Activity creation structure
- [ ] Remote actor fetching in `actor-sync.service.ts`
- [ ] Followers/following collections in `actor.handler.ts`
- [ ] WebFinger for user discovery
- [ ] Activity delivery queue
- [ ] Inbox signature verification
- [ ] NodeInfo endpoint
- [ ] Instance blocking