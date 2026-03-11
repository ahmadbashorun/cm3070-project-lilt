# Lilt

An emotion-aware adaptive email and task management system that reduces workplace stress through intelligent interface adaptation.

## Overview

Lilt detects user stress through multimodal behavioural signals and progressively simplifies the interface to reduce cognitive load. Unlike simple emotion detection systems, Lilt implements **Emotional Context Intelligence** — understanding *why* users are stressed to provide contextually appropriate adaptations.

## Features

- **Multimodal Stress Detection**: Keyboard dynamics, mouse behaviour, posture analysis, and facial expression recognition
- **Privacy-First Architecture**: All detection runs locally in the browser via MediaPipe — no video or data transmitted externally
- **Progressive UI Adaptation**: Five stress states (S0–S4) with increasingly simplified interfaces
- **Context-Aware Filtering**: Email and task prioritisation based on urgency, deadlines, and sender importance
- **Recovery Interventions**: Guided breathing exercises and break suggestions at high stress levels
- **Transparent Adaptation**: Users see why changes occur and can override any adaptation instantly

## Stress States

| State | Description | Email View | Task View |
|-------|-------------|------------|-----------|
| S0 | Baseline | Full inbox with sidebar | 5-column Kanban |
| S1 | Mild | Reduced chrome, 3 emails | 3-column Kanban |
| S2 | Moderate | Binary grouping ("Needs attention" / "Can wait") | Simplified list |
| S3 | High | Single-email focus with guidance | Single-task detail |
| S4 | Overload | Full-screen breathing exercise | Recovery mode |

## Tech Stack

- **Framework**: React 18, Next.js 14, TypeScript
- **State Management**: Zustand
- **Styling**: Sass modules, Framer Motion
- **Detection**: MediaPipe (Pose, Face), Browser APIs (keyboard/mouse events)
- **Architecture**: Three-layer ECI (Input Detection → Contextual Interpretation → Adaptive Response)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── components/
│   ├── Detection/           # Stress detection orchestration
│   ├── AdaptiveUI/          # State-driven UI components
│   ├── EmailInterface/      # Adaptive email views (S0–S4)
│   ├── TaskManager/         # Adaptive task views (S0–S4)
│   ├── RecoveryMode/        # Breathing exercise, break screens
│   └── Onboarding/          # Calibration and preferences
├── hooks/
│   ├── useKeyboardMetrics   # Typing speed, errors, rhythm
│   ├── useMouseBehavior     # Velocity, jitter, clicks
│   ├── usePostureDetection  # MediaPipe Pose integration
│   ├── useFacialDetection   # MediaPipe Face integration
│   └── useStressCalculation # Fusion algorithm orchestration
├── store/
│   └── stressStore.ts       # Global state (stress level, inputs, baselines)
└── utils/
    └── stressFusion.ts      # Weighted multimodal fusion algorithm
```

## Detection Weights

```
StressScore = 0.25 × facial + 0.20 × behavioural + 0.15 × postural 
            + 0.30 × contextual + 0.10 × temporal
```

Contextual load (email volume, urgent tasks, deadlines) receives the highest weight, implementing the core ECI principle that workplace stress stems from task demands, not just physiological signals.

## Calibration

During onboarding, users complete:
1. **Keyboard calibration**: Typing exercise to establish baseline WPM and rhythm
2. **Posture calibration**: Neutral position capture for deviation detection

Users can skip calibration (reduced accuracy) or recalibrate via settings.

## Academic Context

This project was developed as a BSc Computer Science final project (CM3070) at the University of London, following the Interaction Design template. The accompanying report documents the theoretical foundations, design decisions, implementation details, and evaluation results.

## Licence

MIT