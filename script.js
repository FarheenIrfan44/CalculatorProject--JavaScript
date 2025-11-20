class Calculator {
  constructor() {
    this.expressionInput = document.getElementById("expression-input");
    this.outputDisplay = document.getElementById("output-display");
    this.historyList = document.getElementById("history-list");
    this.variablesList = document.getElementById("variables-list");
    this.varNameInput = document.getElementById("var-name");
    this.varValueInput = document.getElementById("var-value");
    this.varErrorDisplay = document.getElementById("var-error");

    this.constants = {
      pi: Math.PI,
      e: Math.E,
    };
    this.userVariables = {};
    this.history = this.loadLocalHistory();
    this.setupEventListeners();
    this.updateVariablesDisplay();
    this.renderHistory();
  }

  handleButtonClick(value) {
    switch (value) {
      case "clear":
        this.expressionInput.value = "";
        this.outputDisplay.textContent = "Output";
        break;
      case "backspace":
        this.expressionInput.value = this.expressionInput.value.slice(0, -1);
        break;
      case "calculate":
        this.calculate();
        break;
      default:
        this.appendValue(value);
    }
    this.expressionInput.focus();
  }

  appendValue(value) {
    this.expressionInput.value += value;
  }

  evaluateExpression(expression) {
    const variables = { ...this.constants, ...this.userVariables };

    let processedExpression = expression.trim().toLowerCase();

    for (const [name, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\b${name}\\b`, "g");
      processedExpression = processedExpression.replace(regex, value);
    }

   processedExpression = processedExpression
    .replace(/\^/g, "**") 
   
    
    .replace(/sqrt\s*\(/g, "Math.sqrt(")
    .replace(/sin\s*\(/g, "Math.sin(")
    .replace(/cos\s*\(/g, "Math.cos(")
    .replace(/tan\s*\(/g, "Math.tan(");

    console.log(`I am expression after processig ${processedExpression}`);

    const result = new Function(
      `'use strict'; return (${processedExpression})`
    )();

    if (!isFinite(result)) {
      throw new Error(
        "Division by zero or invalid operation resulting in Infinity."
      );
    }

    return result;
  }

  calculate() {
    const expression = this.expressionInput.value;
    if (!expression.trim()) {
      this.outputDisplay.textContent = "Please enter an expression.";
      return;
    }

    try {
      const result = this.evaluateExpression(expression);
      const formattedResult = result.toFixed(4);

      this.outputDisplay.textContent = formattedResult;
      this.saveHistory(expression, formattedResult);
    } catch (error) {
      let errorMessage = "ERROR: Invalid Expression";
      if (
        error.message.includes("Mismatched parenthesis") ||
        error.message.includes("missing )")
      ) {
        errorMessage = "ERROR: Parenthesis mismatch.";
      } else if (
        error.message.includes("Division by zero") ||
        error.message.includes("Infinity")
      ) {
        errorMessage = "ERROR: Division by zero or resulting in an infinity.";
      } else if (error.message.includes("is not defined")) {
        errorMessage = "ERROR: Undefined variable or invalid syntax.";
      } else if (error.message.includes("unexpected token")) {
        errorMessage = "ERROR: Malformed expression syntax.";
      }
      this.outputDisplay.textContent = errorMessage;
      console.error("Evaluation Error:", error);
    }
  }

  setupEventListeners() {
    document
      .getElementById("calculator-grid")
      .addEventListener("click", (e) => {
        const value = e.target.dataset.value;
        if (value) {
          this.handleButtonClick(value);
        }
      });

    this.expressionInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        this.calculate();
      }
    });

    document.getElementById("add-var-btn").addEventListener("click", () => {
      this.setVariable(this.varNameInput.value, this.varValueInput.value);
    });

    this.historyList.addEventListener("click", (e) => {
      const historyItem = e.target.closest(".history-item");
      const deleteBtn = e.target.closest(".delete-btn");

      if (historyItem && !deleteBtn) {
        this.handleHistoryClick(historyItem);
      } else if (deleteBtn) {
        this.deleteHistory(deleteBtn.dataset.index);
      }
    });

    this.variablesList.addEventListener("click", (e) => {
      if (e.target.closest(".var-name")) {
        this.appendValue(e.target.closest(".var-name").dataset.name);
      } else if (e.target.closest(".delete-var-btn")) {
        this.deleteVariable(e.target.closest(".delete-var-btn").dataset.name);
      }
    });
  }

  setVariable(name, value) {
    const varName = name.trim();
    const varValue = parseFloat(value);

    this.varErrorDisplay.style.display = "none";

    if (!varName) {
      this.varErrorDisplay.textContent = "Name is required.";
      this.varErrorDisplay.style.display = "block";
      return;
    } else if (isNaN(varValue)) {
      this.varErrorDisplay.textContent = "Valid value is required for variable";
      this.varErrorDisplay.style.display = "block";
      return;
    } else if (this.userVariables.hasOwnProperty(varName) || this.constants.hasOwnProperty(varName)) {
      this.varErrorDisplay.textContent = `Cannot use reserved name: '${varName}'`;
      this.varErrorDisplay.style.display = "block";
      return;
    } else if (varName == Number(varName)) {
      this.varErrorDisplay.textContent = `Numbers can not be used as variable names`;
      this.varErrorDisplay.style.display = "block";
      return;
    }

    this.userVariables[varName] = varValue;
    this.updateVariablesDisplay();
    this.varNameInput.value = "";
    this.varValueInput.value = "";
  }

  deleteVariable(name) {
    delete this.userVariables[name];
    this.updateVariablesDisplay();
  }

  loadLocalHistory() {
    try {
      const storedHistory = localStorage.getItem("calcHistory");
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (e) {
      console.error("Could not load history from localStorage:", e);
      return [];
    }
  }

  saveLocalHistory() {
    try {
      localStorage.setItem("calcHistory", JSON.stringify(this.history));
    } catch (e) {
      console.error("Could not save history to localStorage:", e);
    }
  }

  renderHistory() {
    if (this.history.length === 0) {
      this.historyList.innerHTML =
        '<p class="loading-text">History is empty. Solve an expression!</p>';
      return;
    }

    const reversedHistory = [...this.history].reverse();

    this.historyList.innerHTML = reversedHistory
      .map((item, index) => {
        const originalIndex = this.history.length - 1 - index;

        return `
                <div class="history-item" data-expression="${item.expression}" data-index="${originalIndex}">
                    <div class="flex-1 min-w-0 pr-4">
                        <div class="text-xs">${item.expression}</div>
                        <div class="text-lg">${item.result}</div>
                    </div>
                    <button class="delete-btn" data-index="${originalIndex}">&times;</button>
                </div>
            `;
      })
      .join("");
  }

  updateVariablesDisplay() {
    this.variablesList.innerHTML = "";

    Object.entries(this.constants).forEach(([name, value]) => {
      this.variablesList.innerHTML += `
                <div class="var-list-item">
                    <span class="var-name" data-name="${name}">${name}</span>
                    <span>${value.toFixed(4)}</span>
                </div>
            `;
    });

    const varKeys = Object.keys(this.userVariables).sort();
    if (varKeys.length === 0 && Object.keys(this.constants).length === 0) {
      this.variablesList.innerHTML =
        '<p class="loading-text">No user variables defined.</p>';
    } else {
      varKeys.forEach((name) => {
        const value = this.userVariables[name];
        this.variablesList.innerHTML += `
                    <div class="var-list-item">
                        <span class="var-name" data-name="${name}">${name}</span>
                        <span class="text-gray-500" style="padding-right: 20px">${value.toFixed(4)}</span>
                        <button class="delete-var-btn" style="margin-left: 20px" data-name="${name}">&times;</button>
                    </div>
                `;
      });
    }
  }

  saveHistory(expression, result) {
    const newItem = {
      expression: expression,
      result: result,
      timestamp: Date.now(),
    };

    this.history.push(newItem);
    this.saveLocalHistory();
    this.renderHistory();
  }

  handleHistoryClick(itemElement) {
    const expression = itemElement.dataset.expression;
    this.expressionInput.value = expression;
    this.outputDisplay.textContent = "Ready";
    this.expressionInput.focus();
  }

  deleteHistory(index) {
    const idx = parseInt(index);
    if (idx >= 0 && idx < this.history.length) {
      this.history.splice(idx, 1);
      this.saveLocalHistory();
      this.renderHistory();
    }
  }
}

window.onload = () => {
  new Calculator();
};

