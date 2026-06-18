# Contributing to CoverChain 🛡️

Thank you for your interest in contributing to CoverChain! We are building a decentralized parametric microinsurance platform to provide financial protection for informal workers, and we appreciate your help in making this mission a reality.

## 🚀 How to Get Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/coverchain.git
   cd coverchain
   ```
3. **Set up the development environment** by following the instructions in the [README.md](README.md).
4. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠️ Development Guidelines

### Code Style

- **Rust (Contracts):** Follow standard Rust conventions. Use `cargo fmt` before committing.
- **TypeScript (Backend/Oracle/Frontend):** Follow the existing project structure and use meaningful variable names.
- **Commits:** We follow [Conventional Commits](https://www.conventionalcommits.org/). Examples:
  - `feat(contract): add claim history to policy registry`
  - `fix(backend): resolve race condition in premium scheduler`
  - `docs(readme): update deployment instructions`

### Testing

Always run tests before submitting a PR:

- **Contracts:** `cd contracts && cargo test`
- **Backend:** `cd backend && npm test`
- **Oracle:** `cd oracle && npm test`
- **Frontend:** `cd frontend && npm test`

## 📬 Submitting a Pull Request

1. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. **Open a Pull Request** against the `main` branch of the original repository.
3. **Describe your changes** clearly in the PR template.
4. **Link any related issues** (e.g., `Fixes #123`).
5. **Wait for review** from the maintainers.

## 🤝 Community & Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## 💡 Areas to Contribute

- **Smart Contracts:** Optimizations, new policy types, and security enhancements.
- **Oracle Network:** New data providers (e.g., local weather stations, health APIs).
- **Frontend:** UI/UX improvements, accessibility features, and mobile optimization.
- **Documentation:** Clarifying guides, adding examples, and translating documentation.

---

Questions? Feel free to open an issue or reach out to the maintainers!
