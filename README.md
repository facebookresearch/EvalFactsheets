# Eval Factsheets

A web-based tool for generating standardized LaTeX/Markdown/Yaml/CSV evaluation cards for AI/ML model assessments. This tool helps researchers and practitioners create consistent, comprehensive documentation of their evaluation methodologies.

## Quick Start

**Try it now:** [https://facebookresearch.github.io/EvalFactsheets](https://facebookresearch.github.io/EvalFactsheets)

*Link to the paper:* [https://arxiv.org/abs/2512.04062](https://arxiv.org/abs/2512.04062)


## What are Eval Factsheets?

Eval Factsheets provide standardized documentation for AI model evaluations, similar to how Model Cards document model development. They help ensure transparency and reproducibility in evaluation practices by capturing:

- Evaluation Context and Scope
- Evaluation Structure and Method 
- Evaluation Alignment

## Features

- **Interactive Form Interface**: Easy-to-use web form for inputting evaluation details.
- **Interactive Database**: Explore the csv database with a simple interface.
- **Multiple Export Options**: 
  - Copy to clipboard with one click
  - Download as `.tex` file
  - Direct integration with `evaluationcard` LaTeX package
- **Form Validation**: Ensures all required fields are completed
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **No Installation Required**: Browser-based tool, no dependencies needed

## How to Use

### Basic Usage

1. **Navigate to the tool**: Visit [https://facebookresearch.github.io/EvalFactsheets](https://facebookresearch.github.io/EvalFactsheets)
2. **Fill in the form**: Enter your evaluation details in the provided fields
3. **Generate LaTeX**: Click the "Generate LaTeX" button
4. **Export your card**: 
   - Use "Copy to Clipboard" for quick pasting
   - Click "Download .tex" to save the file locally

### Using with LaTeX

Once you have your generated `.tex` file:

```latex
\documentclass{article}
\usepackage{evaluationcard}

\begin{document}
\input{your-evaluation-card.tex}
\end{document}
```

**Note:** You'll need the `evaluationcard.sty` LaTeX package in your folder.

## Use Cases

- **Research Papers**: Document evaluation methodology for academic publications
- **Model Development**: Track evaluation procedures during model iterations
- **Team Collaboration**: Share standardized evaluation details across teams
- **Reproducibility**: Provide clear documentation for others to replicate evaluations

## Contributing

We welcome contributions! Here's how you can help:

### Contributor License Agreement ("CLA")
In order to accept your pull request, we need you to submit a CLA. You only need
to do this once to work on any of Meta's open source projects.

Complete your CLA here: <https://code.facebook.com/cla>

### Contributing to the EvalFactSheets Database
Just fill the form, generate the code, then copy the csv line and click on the "Add to GitHub" button. It will open the `evaluation_cards_database.csv` file that you can edit to add your csv line at the end of the file. Then, we will review the pull request and let you know if there is any issues.

### Reporting Issues

If you find a bug or have a feature request:
1. Check if it's already reported in [Issues](https://github.com/facebookresearch/EvalFactsheets/issues)
2. If not, create a new issue with:
   - Clear description of the problem/feature
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m "Add: feature description"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request with:
   - Description of changes
   - Any related issue numbers
   - Screenshots/examples if applicable

### Development Guidelines

- Keep code clean and well-commented
- Maintain the existing code style
- Test across different browsers
- Update documentation for new features

## DISCLAIMER
Some items in the csv database were generated using agentic tools. Even after human reviews, it's still possible that some mistakes might be there. We will be performing an ongoing monitoring to make the database truthful. If you see any error in one of the benchmark, please make a pull request.

## License

This project is licensed under the cc-by-nc License - see the [LICENSE.md](LICENSE.md) file for details.

---

**Citation**: If you use this tool in your research, please cite:

```bibtex
@software{evalfactsheets2025,
  title={EvalFactsheets},
  author={Florian Bordes, Candace Ross, Justine T Kao, Evangelia Spiliopoulou, Adina Williams},
  year={2025},
  url={https://github.com/facebookresearch/EvalFactsheets}
}
```
