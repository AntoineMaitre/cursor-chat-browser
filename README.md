# Cursor Chat Browser

A web application for browsing and managing chat histories from the Cursor editor's AI chat feature. View, search, and export your AI conversations in various formats.

## Features

- 🔍 Browse and search all workspaces with Cursor chat history
- 🌐 Support for both workspace-specific and global storage (newer Cursor versions)
- 🤖 View both AI chat logs and Composer logs
- 📁 Organize chats by workspace
- 🔎 Full-text search with filters for chat/composer logs
- 📱 Responsive design with dark/light mode support
- ⬇️ Export chats as:
  - Markdown files
  - HTML documents (with syntax highlighting)
  - PDF documents
  - **JSON format for semantic search and pattern analysis** ✨
- 🎨 Syntax highlighted code blocks
- 📌 Bookmarkable chat URLs
- ⚙️ Automatic workspace path detection
- 📊 **Conversation data export for building RAG systems and analyzing best practices**

## Prerequisites

- Node.js 18+ and npm
- A Cursor editor installation with chat history

## Installation

1. Clone the repository:
  ```bash
  git clone https://github.com/thomas-pedersen/cursor-chat-browser.git
  cd cursor-chat-browser
  ```

2. Install dependencies:
  ```bash
  npm install
  ```

3. Start the development server:
  ```bash
  npm run dev
  ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

The application automatically detects your Cursor workspace storage location based on your operating system:

- Windows: `%APPDATA%\Cursor\User\workspaceStorage`
- WSL2: `/mnt/c/Users/<USERNAME>/AppData/Roaming/Cursor/User/workspaceStorage`
- macOS: `~/Library/Application Support/Cursor/User/workspaceStorage`
- Linux: `~/.config/Cursor/User/workspaceStorage`
- Linux (remote/SSH): `~/.cursor-server/data/User/workspaceStorage`

If automatic detection fails, you can manually set the path in the Configuration page (⚙️).

**Note:** Recent versions of Cursor have moved chat data storage from workspace-specific locations to global storage. This application now supports both storage methods to ensure compatibility with all Cursor versions.

## Usage

### Browsing Logs
- View all workspaces on the home page
- Browse AI chat logs by workspace
- Access Composer logs from the navigation menu
- Navigate between different chat tabs within a workspace
- View combined logs with type indicators
- See chat and composer counts per workspace

### Searching
- Use the search bar in the navigation to search across all logs
- Filter results by chat logs, composer logs, or both
- Search results show:
  - Type badge (Chat/Composer)
  - Matching text snippets
  - Workspace location
  - Title
  - Timestamp

### Exporting

#### Individual Conversation Export
Each log can be exported as:
- **Markdown**: Plain text with code blocks
- **HTML**: Styled document with syntax highlighting
- **PDF**: Formatted document suitable for sharing

#### Bulk Data Export for Analysis
Access the **Export** page to export all conversations in structured JSON format, optimized for:
- **Semantic Search**: Create embeddings with OpenAI, Cohere, or local models
- **Pattern Analysis**: Identify which prompting strategies work best
- **RAG Systems**: Build custom retrieval-augmented generation systems
- **Documentation**: Extract best practices and methodologies from successful conversations
- **Vector Databases**: Import into Pinecone, Qdrant, Weaviate, ChromaDB, etc.

Each exported conversation includes:
- Full message history with user/assistant roles
- Timestamps and metadata
- Code context and file references
- Conversation statistics and summaries

See [EXPORT_GUIDE.md](EXPORT_GUIDE.md) for detailed examples and integration guides.

## Development

Built with:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- SQLite for reading Cursor's chat database

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.