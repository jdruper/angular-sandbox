# PlantUML Diagrams for Sandbox Pattern

This directory contains comprehensive PlantUML diagrams that illustrate the Angular Sandbox Pattern architecture. These diagrams are designed for external documentation, presentations, and architectural discussions.

## Viewing the Diagrams

### Online PlantUML Editor
1. Visit [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
2. Copy the content from `architecture-diagrams.puml`
3. Paste into the editor to view and export diagrams

### VS Code Extension
1. Install the "PlantUML" extension by jebbs
2. Open `architecture-diagrams.puml`
3. Use `Ctrl+Shift+P` → "PlantUML: Preview Current Diagram"

### Command Line (with PlantUML installed)
```bash
# Generate PNG images
plantuml architecture-diagrams.puml

# Generate SVG images  
plantuml -tsvg architecture-diagrams.puml

# Generate PDF
plantuml -tpdf architecture-diagrams.puml
```

## Included Diagrams

### 1. Architecture Overview
- **Purpose**: High-level view of the Sandbox Pattern components
- **Shows**: Smart/Dumb component layers, service dependencies, external systems
- **Use Cases**: Architecture presentations, onboarding new developers

### 2. Data Flow Sequence
- **Purpose**: Illustrates how data flows through the system during user interactions
- **Shows**: Loading data flow, user action flow, service interactions
- **Use Cases**: Understanding request/response cycles, debugging issues

### 3. Service Dependencies
- **Purpose**: Detailed view of service structure and responsibilities
- **Shows**: Class relationships, method signatures, dependency injection
- **Use Cases**: Service design discussions, refactoring planning

### 4. Component Structure
- **Purpose**: Component architecture and communication patterns
- **Shows**: Smart vs dumb components, @Input/@Output flow, service injection
- **Use Cases**: Component design reviews, UI architecture planning

### 5. Testing Strategy
- **Purpose**: Overview of testing approach and coverage
- **Shows**: Unit tests, component tests, integration tests, mocking strategies
- **Use Cases**: Test planning, quality assurance discussions

## Integration with Documentation

These diagrams complement the main README.md and provide visual representations suitable for:

- **Architecture Decision Records (ADRs)**
- **Technical documentation**
- **Team presentations**
- **Code review discussions**
- **Onboarding materials**
- **External stakeholder communications**

## Customization

The diagrams use PlantUML's plain theme for clean, professional output. You can customize:

- **Colors**: Modify `skinparam backgroundColor` and component colors
- **Fonts**: Adjust `skinparam defaultFontSize` and font families
- **Layout**: Change component positioning and grouping
- **Content**: Add/remove components or relationships as your architecture evolves

## Export Formats

PlantUML supports multiple output formats:
- **PNG**: For web documentation and presentations
- **SVG**: For scalable vector graphics
- **PDF**: For formal documentation
- **LaTeX**: For academic or technical papers
- **ASCII**: For text-based documentation

## Maintenance

Keep these diagrams updated when:
- Adding new services or components
- Changing service relationships
- Modifying data flow patterns
- Updating testing strategies
- Evolving the architecture

The diagrams should reflect the actual implementation in the codebase to maintain their value as documentation.