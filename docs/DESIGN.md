# DESIGN.md - Federated Slide Sharing & Microblogging Platform

## Overview
A federated platform combining microblogging with PDF presentation sharing, where users can share both short posts and presentations while maintaining full ownership of their content.

## Key Decisions

### 1. Why Combine Microblogging with Slide Sharing?
- **Context**: Presentations need discussion and commentary
- **Discovery**: Posts can announce and promote presentations
- **Community**: Builds engagement around shared knowledge
- **Federation**: Single identity for both content types

### 2. Why PDF-First Approach?
- **Universal**: PDF is the most common presentation format
- **Simple**: No complex slide extraction needed initially
- **Quality**: Preserves original formatting perfectly
- **Storage**: Single file instead of many images

### 3. Why PDF.js for Viewing?
- **Client-side**: No server processing required
- **Performance**: Renders directly in browser
- **Features**: Built-in text selection, search, zoom
- **Mobile**: Works on all devices

### 4. Why Federate Presentations?
- **Ownership**: Users control their content
- **Persistence**: Content survives platform changes
- **Academic**: Ideal for research and education
- **Network Effect**: Wider reach without centralization

## Implementation Roadmap

### Phase 1: Foundation
**Goal**: Solid microblogging platform with working federation

- [ ] Complete federation handlers (Follow, Like, Delete)
- [ ] Implement timelines (Home, User, Pagination)
- [ ] Add interactions (Replies, Likes, Boosts)
- [ ] Polish frontend (Timeline UI, Composer, Interactions)

### Phase 2: PDF Infrastructure
**Goal**: Basic PDF upload and viewing

- [ ] Create Presentation entity
- [ ] Build upload pipeline with validation
- [ ] Generate thumbnails from first page
- [ ] Integrate PDF.js viewer

### Phase 3: Unified Platform
**Goal**: Seamlessly integrate PDFs with microblogging

- [ ] Mixed content timeline
- [ ] Presentation interactions (Like, Comment, Share)
- [ ] User profile tabs (Posts, Presentations)
- [ ] Content type filters

### Phase 4: Federation Enhancement
**Goal**: Full federation support for presentations

- [ ] ActivityPub Document type
- [ ] Remote PDF viewing
- [ ] Federated interactions
- [ ] Cross-instance compatibility

### Phase 5: Discovery & Polish
**Goal**: Enhanced user experience

- [ ] Search functionality
- [ ] Tag system
- [ ] View analytics
- [ ] Mobile optimization
- [ ] Performance improvements

## Technical Architecture

### Content Model
```typescript
// Existing
Note {
  content: string
  author: User
}

// New
Presentation {
  title: string
  description: string
  fileUrl: string
  thumbnailUrl: string
  pageCount: number
  author: User
}
```

### Storage Strategy
- **PDFs**: S3-compatible storage or local filesystem
- **Thumbnails**: Generated on upload, cached
- **Metadata**: PostgreSQL database

### Federation Model
```json
{
  "type": "Create",
  "object": {
    "type": "Document",
    "name": "Presentation Title",
    "content": "Description",
    "attachment": {
      "type": "Link",
      "mediaType": "application/pdf",
      "href": "https://instance/files/doc.pdf"
    }
  }
}
```