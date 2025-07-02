# Angular Sandbox Pattern Template

A production-ready Angular 19 starter template demonstrating the **Sandbox Pattern** - a clean architectural approach for building scalable, maintainable applications with proper separation of concerns.

## 🏗️ Architecture Overview

The Sandbox Pattern isolates business logic into dedicated services that orchestrate data flow between your API, state management, and components. This creates a clean, testable architecture that scales well.

```
┌─────────────────────────────────────────────────────────────┐
│             InventoryDashboardComponent                     │
│                      (Container)                            │
│                          │                                  │
│                          ▼                                  │
│                   ActionService                             │
│                     (Facade)                                │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 ▼                 │
        │         Sandbox Services          │
        │  ┌─────────────┐ ┌─────────────┐  │
        │  │StateService │ │Transformation│  │
        │  │  (Signals)  │ │Service(Pure)│  │
        │  └─────────────┘ └─────────────┘  │
        │  ┌─────────────┐                  │
        │  │ ApiService  │                  │
        │  │(HTTP Only)  │                  │
        │  └─────────────┘                  │
        └───────────────────────────────────┘
```

## 🎯 Core Principles

### Service Responsibilities

| Service | Purpose | Contains | Does NOT Contain |
|---------|---------|----------|------------------|
| **ActionService** | Business logic orchestration | Component interactions, error handling, service coordination, computed business logic | Direct HTTP calls, state mutations, data transformations |
| **StateService** | State management | Angular Signals, computed values, state mutations (setItems, addItem, etc.) | Business logic, HTTP calls, data transformation |
| **TransformationService** | Data transformation | API ↔ Domain model conversion, validation, calculations, filtering, sorting | State management, HTTP calls, side effects |
| **ApiService** | HTTP operations | CRUD operations (GET/POST/PUT/DELETE), mock data simulation | Business logic, state management, data transformation |

### Component Architecture

**Container Components (Smart)**
- Inject ActionService for business logic
- Provide component-scoped services 
- Handle user interactions and data flow
- Pass data to presentation components via @Input

**Presentation Components**
- Receive data via @Input properties
- Emit events via @Output emitters
- Zero business logic or service dependencies
- Pure, reusable, easily testable

## 🚀 Quick Start

### Prerequisites
- Node.js 22.12+ 
- npm 10+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sandbox-pattern-app

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200`

### Build & Test

```bash
# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 🔧 Code Quality Tools

The template includes a comprehensive code quality setup with ESLint and Prettier to ensure consistent code style and catch potential issues.

### ESLint Configuration

**Setup**: Modern ESLint 9 flat config with TypeScript and Angular support
- **TypeScript**: `typescript-eslint` with recommended and stylistic rules
- **Angular**: `angular-eslint` with component/directive selector rules
- **Templates**: HTML template linting with accessibility checks

**Key Rules**:
- Component selectors must use `app-` prefix with kebab-case
- Directive selectors must use `app` prefix with camelCase
- Template accessibility checks enabled
- TypeScript strict rules enforced

### Prettier Configuration

**Consistent Formatting**:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Angular Template Support**: Special parser for `.html` files

### Available Commands

```bash
# Lint TypeScript and templates
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format all files
npm run format

# Check formatting without changes
npm run format:check
```

### EditorConfig

Cross-editor consistency with `.editorconfig`:
- 2-space indentation
- UTF-8 encoding
- Single quotes for TypeScript
- Trimmed trailing whitespace

### IDE Integration

**VS Code**: Install these extensions for optimal experience:
- ESLint (`ms-vscode.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Angular Language Service (`Angular.ng-template`)

**Configuration**: Enable format on save and linting in your IDE settings.

## 📁 Project Structure

```
src/app/
├── core/                    # Application-wide services and utilities
│   ├── services/           # Shared services (DataService)
│   ├── models/             # Shared interfaces and types
│   ├── guards/             # Route guards
│   └── interceptors/       # HTTP interceptors
├── shared/                 # Reusable dumb components
│   ├── components/         # Presentation components
│   ├── pipes/              # Custom pipes
│   ├── directives/         # Custom directives
│   └── utils/              # Utility functions
├── features/               # Feature modules
│   └── dashboard/
│       ├── components/     # Feature-specific dumb components
│       └── containers/     # Smart container components
├── layouts/                # Layout components (future expansion)
│   ├── main-layout/        # Primary app layout
│   └── auth-layout/        # Authentication layout
└── sandbox/                # 🎯 Core Sandbox Pattern Implementation
    ├── models/             # Domain and API models
    ├── services/           # Business logic services
    └── transformations/    # Data transformation functions
```

## 🎨 Component Patterns

### Container Component Example

```typescript
@Component({
  selector: 'app-inventory-dashboard',
  providers: [ItemActionService, ItemStateService], // Component-scoped
})
export class InventoryDashboardComponent implements OnInit {
  private actionService = inject(ItemActionService);

  // Expose state directly from ActionService
  items = this.actionService.items;
  loading = this.actionService.loading;
  totalValue = this.actionService.totalInventoryValue;

  ngOnInit() {
    this.actionService.loadItems(); // Business logic
  }

  onItemDeleted(id: string) {
    this.actionService.deleteItem(id); // Delegate to ActionService
  }
}
```

### Presentation Component Example

```typescript
@Component({
  selector: 'app-item-list',
})
export class ItemListComponent {
  @Input() items: Item[] = [];
  @Input() loading = false;
  @Output() itemDeleted = new EventEmitter<string>();

  onDelete(id: string) {
    this.itemDeleted.emit(id); // Just emit, no business logic
  }
}
```

## 🔄 Data Flow

### Loading Data Flow
1. **Container Component** calls `actionService.loadItems()`
2. **ActionService** sets loading state and calls ApiService
3. **ApiService** fetches raw data from API
4. **TransformationService** converts API data to domain models
5. **StateService** updates items signal with transformed data
6. **Container Component** receives signal updates automatically
7. **Presentation Components** get updated data via @Input properties

### User Action Flow  
1. **Presentation Component** emits event via @Output (e.g., `itemDeleted.emit(id)`)
2. **Container Component** handles event and calls ActionService
3. **ActionService** orchestrates business logic and API calls
4. **StateService** updates based on API response
5. **Signal changes** propagate back to Container Component
6. **Updated data** flows down to Presentation Components via @Input


## 🔧 Extending the Pattern

### Adding a New Feature

1. **Create Feature Module**
   ```bash
   ng generate component features/products/containers/product-management
   ```

2. **Create Sandbox Services**
   ```bash
   ng generate service sandbox/services/product-action
   ng generate service sandbox/services/product-state
   ng generate service sandbox/services/product-transformation
   ```

3. **Define Models**
   ```typescript
   // sandbox/models/product.model.ts
   export interface Product {
     id: string;
     name: string;
     // ... other properties
   }
   ```

4. **Implement Services** following the same pattern as `ItemActionService`

### Adding New Presentation Components

```bash
ng generate component shared/components/product-card
```

Follow the @Input/@Output pattern with no business logic.

## 🎯 Best Practices

### DO ✅
- Keep ActionService as the single entry point for container components
- Use component-scoped services for isolation
- Make transformation functions pure (no side effects)
- Emit events from presentation components, handle in container components
- Use TypeScript strict mode for better type safety

### DON'T ❌
- Don't inject ApiService directly into components
- Don't put business logic in presentation components
- Don't share StateService instances between features
- Don't mix transformation logic with API calls
- Don't bypass ActionService for state updates

## 🚀 Production Considerations

### Performance
- **OnPush Change Detection**: All presentation components use OnPush strategy
- **Signal-based State**: Reactive updates without zone pollution
- **Component Scoping**: Each feature has isolated services

### Scalability
- **Micro Frontend Ready**: Each feature is self-contained
- **Lazy Loading**: Features can be easily lazy-loaded
- **Service Isolation**: No shared state between features

### Testing
- **High Test Coverage**: All services have comprehensive tests
- **Mockable Architecture**: Easy to mock dependencies
- **Pure Functions**: Transformation logic is highly testable

## 📚 Additional Resources

- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular Testing Best Practices](https://angular.dev/guide/testing)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

## 🤝 Contributing

This template is designed to be a starting point. Feel free to:
- Add new features following the established patterns
- Improve the existing implementations
- Add additional presentation components to the shared library
- Extend the testing coverage

## 📄 License

This project is open source and available under the [MIT License](LICENSE).