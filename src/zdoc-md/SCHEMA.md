# Data Schema — Book / Chapter / Record (Visible Numbering)

## Visible Numbering
- **Book & Chapter:** start `000.00`, step **5**
- **Record:** start `000.00`, step **10** (per-book scope)
- Stored as string `DDD.DD` for precise sorting and display.

## Collections
### Book
- `title` (String, required)
- `visibleNumber` (String, unique)
- `author` (String)
- `meta` (Mixed)
- Index: `{ visibleNumber: 1 } unique`

### Chapter
- `bookId` (ObjectId → Book, required)
- `visibleNumber` (String, unique within `bookId`)
- `title` (String, required)
- `summary` (String)
- `meta` (Mixed)
- Index: `{ bookId: 1, visibleNumber: 1 } unique`

### Record
- `bookId` (ObjectId → Book, required)
- `chapterId` (ObjectId → Chapter, optional)
- `visibleNumber` (String, unique within `bookId`)
- `content` (String)
- `meta` (Mixed)
- Index: `{ bookId: 1, visibleNumber: 1 } unique`
