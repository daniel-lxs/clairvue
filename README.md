# Clairvue

## Description

Clairvue is a multi-user RSS feed aggregator designed for efficient content organization and seamless reading. With support for private and public collections, configurable feed updates, and scalable synchronization, Clairvue simplifies managing and consuming RSS feeds in collaborative or individual workflows.

## Key Features

### Core Functionality

- **Private and Public Collections:** Users can create private feeds and collections, while admins can publish public collections for subscription or cloning.
- **Feed Configuration:** Customize update frequencies and specify if articles should be read directly in-app.
- **URL Article Import:** Import web content by URL and detect readable articles automatically.

### Technical Highlights

- **Scalable Worker System:** Synchronization tasks are offloaded to scalable worker instances, ensuring efficient updates even with large numbers of feeds.
- **Built-in Reader:** Provides a distraction-free reading mode with dark/light themes and font size adjustments.
- **Filters and Search (Planned):** Includes chronological and unread filters, with topic detection and advanced queries under development.
- **Authentication:** Basic authentication implemented, with OAuth planned for future releases.

### Planned Enhancements

- **Annotations:** Add notes and highlights directly within articles.
- **Topic Detection:** Automatically categorize articles by content themes.

## Monorepo Structure

Clairvue uses a monorepo structure to organize its components for modularity and collaboration. The repository is divided into the following packages:

- **`app`**: The main application responsible for the frontend and backend logic, including the user interface and API routes.
- **`workers`**: Handles background tasks such as feed synchronization, caching, and other time-intensive processes.
- **`types`**: Shared TypeScript definitions used across the monorepo to ensure consistent type safety and reduce duplication.

## Tech Stack

### Frontend

- **SvelteKit**: A framework for building web applications
- **Shadcn Svelte**: UI components for Svelte

### Backend

- **SvelteKit API Routes**: For handling backend logic
- **PostgreSQL**: Relational database for data storage
- **BullMQ**: For managing queues
- **Redis**: For caching and queue management

### Build and Run

```bash
docker-compose up --build
```

## Installation and Usage

1. Clone the repository.
2. Navigate to the project directory.
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the application:
   ```bash
   pnpm run dev:app
   ```
5. Start the workers:
   ```bash
   pnpm run dev:workers
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.
