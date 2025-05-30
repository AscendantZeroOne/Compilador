let fileHandle;
let nlist = [];

async function createFile() {
    document.getElementById('editor').innerText = '';
    updateLineNumbers();
    fileHandle = null;
}

console.log(gram);

async function openFile() {
    try {
        [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }]
        });
        const file = await fileHandle.getFile();
        const contents = await file.text();
        document.getElementById('editor').innerText = contents;
        updateLineNumbers();
        updateHighlighting();
    } catch (err) {
        console.error('Failed to open file:', err);
    }
}

async function saveFile() {
    try {
        if (!fileHandle) {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: 'untitled.txt',
                types: [{ description: 'Text Files', accept: { 'text/plain': ['.txt'] } }]
            });
        }
        const writable = await fileHandle.createWritable();
        await writable.write(document.getElementById('editor').innerText);
        await writable.close();
    } catch (err) {
        console.error('Failed to save file:', err);
    }
}

function updateLineNumbers() {
    const editor = document.getElementById('editor');
    const lineNumbers = document.getElementById('line-numbers');

    let lines = 1;

    const childNodes = editor.childNodes;
    lines = Array.from(childNodes).filter(node => node.nodeType === 1 || node.nodeType === 3).length;

    console.log("Line count:", lines);
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br>');
}

function handlePasteEvent(event) {
    const editor = document.getElementById('editor');
    const lineNumbers = document.getElementById('line-numbers');
    
    setTimeout(() => {
        const text = editor.innerText;
        const lines = text.split(/\n|\r/).length;
        
        console.log("Pasted line count:", lines);
        lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br>');
    }, 0);
}

document.getElementById('editor').addEventListener('paste', handlePasteEvent);


document.getElementById('editor').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {

        insertNewLineWithZeroWidthSpace();
        updateLineNumbers();
    }
});

function insertNewLineWithZeroWidthSpace() {
    document.execCommand('insertHTML', false, '<div>&#8203;</div>');
}


function syncScroll() {
    document.getElementById('line-numbers').scrollTop = document.getElementById('editor').scrollTop;
    document.getElementById('highlighting').scrollTop = document.getElementById('editor').scrollTop;
}

const keywords = ["program", "procedure", "begin", "end", "if", "then", "else", "while", "do", "read", "write", "true", "false"];
const operators = ["=", "<>", "<", "<=", ">=", "/", ">", "+", "-", "*", "and", "or", "not", ":="];
const varNames = ["int", "boolean"];
const symbols = ["(", ")", ",", ".", ";", ":"];
const floatRegex = /\d+\.\d+/g;
const numbersRegex = /\d+/g;
const identifiersRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g;
const invalidIdentifierRegex = /\d+[a-zA-Z_]+|&\w*|%\w*|#\w*|@\w*|[a-zA-Z0-9_]{24, }/;
let lextokens;

function createSyntaxAction(stackItem, inputItem, action) {
    return {
        'stackItem': stackItem,
        'inputItem': inputItem,
        'action': action
    };
}

let syntaxTable = [
    createSyntaxAction('', 'Identifier', ''),
    createSyntaxAction('', 'Identifier', ''),
    createSyntaxAction('', 'Identifier', ''),
    createSyntaxAction('', 'Identifier', ''),
    createSyntaxAction('', 'Identifier', ''),
    createSyntaxAction('', 'Identifier', ''),
    createSyntaxAction('', 'Identifier', ''),
    createSyntaxAction('', 'Identifier', ''),
    createSyntaxAction('', 'Identifier', ''),
    createSyntaxAction('', 'Identifier', ''),
];

function updateHighlighting() {
    const editor = document.getElementById('editor');
    const highlighting = document.getElementById('highlighting');

    let text = editor.innerHTML;
    let highlightedText = text.replace(/\b(\w+)\b/g, (match) => {
        if (keywords.includes(match)) {
            return `<span id="keywords" style="color: red;">${match}</span>`;
        } if(operators.includes(match)) {
            return `<span id="keywords" style="color: blue;">${match}</span>`;
        }
        return match;
    });

    highlighting.innerHTML = highlightedText;
}



function buildTable() {
    lextokens = [];
    nlist = [];
    const text = document.getElementById('editor').innerText;
    const lines = text.split('\n');
    let tableHtml = '<table border="1"><thead><tr><th>Palavra</th><th>Token</th><th>Linha</th><th>Coluna Inicial</th><th>Coluna Final</th></tr></thead><tbody>';

    const tokenRegex = /:=|\d+\.\d+|\d*[@%#&a-zA-Z_]+\d*|(program|procedure|begin|end|if|then|else|while|do|read|write|true|false)|[a-zA-Z_][a-zA-Z0-9_]*|\d+|[=<>+\-*/();,.:]/g;
    let insideCommentBlock = false;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        let line = lines[lineIndex];
        let rowStyle = '';

        // Remove comentários linha e bloco
        let commentIndex = line.indexOf('//');
        if (commentIndex !== -1) line = line.substring(0, commentIndex);

        if (insideCommentBlock) {
            const end = line.indexOf('}');
            if (end !== -1) {
                insideCommentBlock = false;
                line = line.substring(end + 1);
            } else {
                continue;
            }
        }

        const startBlock = line.indexOf('{');
        const endBlock = line.indexOf('}');
        if (startBlock !== -1 && endBlock !== -1) {
            line = line.slice(0, startBlock) + line.slice(endBlock + 1);
        } else if (startBlock !== -1) {
            insideCommentBlock = true;
            line = line.substring(0, startBlock);
        }

        tokenRegex.lastIndex = 0;
        let match;
        let previousWasProcedure = false;

        while ((match = tokenRegex.exec(line)) !== null) {
            const word = match[0];
            let token = '';
            let startCol = match.index + 1;
            let endCol = startCol + word.length - 1;

            if (keywords.includes(word)) {
                switch (word) {
                    case "program": token = "KeyWord_Program"; break;
                    case "procedure": token = "KeyWord_Procedure"; previousWasProcedure = true; break;
                    case "begin": token = "KeyWord_Begin"; break;
                    case "end": token = "KeyWord_End"; break;
                    case "if": token = "KeyWord_If"; break;
                    case "then": token = "KeyWord_Then"; break;
                    case "else": token = "KeyWord_Else"; break;
                    case "while": token = "KeyWord_While"; break;
                    case "do": token = "KeyWord_Do"; break;
                    case "read": token = "KeyWord_Read"; break;
                    case "write": token = "KeyWord_Write"; break;
                    case "true": token = "KeyWord_true"; break;
                    case "false": token = "KeyWord_False"; break;
                }
            } else if (symbols.includes(word)) {
                token = {
                    '(': "Symbol_LeftParenthesis",
                    ')': "Symbol_RightParenthesis",
                    ',': "Symbol_Comma",
                    '.': "Symbol_Dot",
                    ';': "Symbol_Semicolon",
                    ':': "Symbol_Colon"
                }[word];
            } else if (operators.includes(word)) {
                token = {
                    "=": "Operator_equivalence",
                    "<>": "Operator_<>",
                    "<=": "Operator_lesserequal",
                    "<": "Operator_lesser",
                    ">=": "Operator_greaterequal",
                    ">": "Operator_greater",
                    "+": "Operator_plus",
                    "-": "Operator_-",
                    "*": "Operator_multiplication",
                    "/": "Operator_div",
                    "and": "Operator_logicalOperatorAnd",
                    "or": "Operator_logicalOperatorOr",
                    "not": "Operator_logicalOperatorNot",
                    ":=": "Operator_att"
                }[word];
            } else if (varNames.includes(word)) {
                token = word === "int" ? "Type_Int" : "Type_Boolean";
            } else if (invalidIdentifierRegex.test(word)) {
                token = "Lexicon_Error";
                rowStyle = ' style="background-color: red; color: white;"';
            } else if (!isNaN(word)) {
                token = "Number_Int";
            } else {
                token = "Identifier";
            }

            if (!token.includes("Lexicon_Error")) {
                rowStyle = ' style="background-color: white; color: black;"';
            }

            // Se o token atual é identificador logo após procedure, adiciona à nlist
            if (previousWasProcedure && token === "Identifier") {
                nlist.push(word);
                previousWasProcedure = false;
            }

            tableHtml += `<tr${rowStyle}><td>${word}</td><td>${token}</td><td>${lineIndex + 1}</td><td>${startCol}</td><td>${endCol}</td></tr>`;
            lextokens.push({ word, token });
        }
    }

    // Atualiza gramática com chamadas diretas
    if (typeof gram !== 'undefined' && typeof nts !== 'undefined') {
        const callProd = ['Symbol_LeftParenthesis', nts.expression_list, 'Symbol_RightParenthesis'];
        const added = new Set();
        nlist.forEach(proc => {
            if (!added.has(proc)) {
                gram[nts.procedure_call].push([proc, ...callProd]);
                added.add(proc);
            }
        });
        console.log("Chamadas de procedimento adicionadas:", gram[nts.procedure_call]);
    }

    tableHtml += '</tbody></table>';
    document.getElementById('table-container').innerHTML = tableHtml;
}



//function syntAnalysis()
//{
//    let pairs = [];
//    for (let i = 0; i < lextokens.length; i++) {
//        let lex = lextokens[i];

//    }

//}

function updatedSyntaxAnalysis() {

}

// script_fixed.js - Includes fixed syntactic analysis with proper scoping

// Versão corrigida e robusta do analisador sintático descendente
// Versão corrigida e robusta do analisador sintático descendente
// Versão corrigida e robusta do analisador sintático descendente
function syntAnalysis() {
    if (!lextokens || lextokens.length === 0) {
        alert('Clique em Build antes por favor');
        return;
    }

    let i = 0;
    let stack = ['$', nts.program];
    let trace = [];
    let errorCount = 0;

    function nextToken() {
        return lextokens[i] ? lextokens[i].token : '$';
    }

    function nextWord() {
        return lextokens[i] ? lextokens[i].word : '$';
    }

    function getStackString(stack) {
        return stack.map(s => typeof s === 'number' ? nonTerminals[s] : s).reverse().join(' ');
    }

    function getInputStringWords(startIndex) {
        const input = lextokens.slice(startIndex).map(t => t.word);
        input.push('$');
        return input.join(' ');
    }

    while (stack.length > 0) {
        const top = stack.pop();
        const lookahead = nextToken();

        trace.push({
            stack: getStackString([...stack, top]),
            input: getInputStringWords(i),
            action: '',
            comment: ''
        });

        if (top === '$') {
            if (lookahead === '$') {
                trace.at(-1).action = 'Aceita';
                trace.at(-1).comment = 'Análise concluída com sucesso';
            } else {
                trace.at(-1).action = 'Erro';
                trace.at(-1).comment = 'Tokens restantes após fim da pilha';
                errorCount++;
            }
            break;
        } else if (typeof top === 'string') {
            if (top === lookahead) {
                trace.at(-1).action = `Consome '${nextWord()}'`;
                i++;
            } else {
                trace.at(-1).action = 'Erro';
                trace.at(-1).comment = `Esperado '${top}', mas encontrado '${lookahead}'`;
                errorCount++;
                break;
            }
        } else {
            const productions = gram[top];
            let matched = false;

            for (const prod of productions) {
                let first = prod[0];
                if (
                    (prod.length === 0 && !lookaheadInFirstSet(top, lookahead)) ||
                    (typeof first === 'string' && first === lookahead) ||
                    (typeof first === 'number' && matchFirst(first, lookahead))
                ) {
                    trace.at(-1).action = `Produção ${nonTerminals[top]} → ${prod.length ? prod.map(p => typeof p === 'number' ? nonTerminals[p] : p).join(' ') : 'ε'}`;
                    for (let j = prod.length - 1; j >= 0; j--) {
                        stack.push(prod[j]);
                    }
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                trace.at(-1).action = 'Erro';
                trace.at(-1).comment = `Nenhuma produção válida para '${nonTerminals[top]}' com '${lookahead}'`;
                errorCount++;
                break;
            }
        }
    }

    buildTraceTable(trace);
    alert(`Erros sintáticos encontrados: ${errorCount}`);
}

function isNullable(nonTerminal) {
    const productions = gram[nonTerminal];
    return productions.some(p => p.length === 0);
}

function matchFirst(nonTerminal, token, visited = new Set()) {
    if (visited.has(nonTerminal)) return false;
    visited.add(nonTerminal);

    const productions = gram[nonTerminal];
    for (const prod of productions) {
        for (const symbol of prod) {
            if (typeof symbol === 'string') {
                if (symbol === token) return true;
                else break;
            } else if (typeof symbol === 'number') {
                if (matchFirst(symbol, token, visited)) return true;
                if (!isNullable(symbol)) break;
            }
        }
    }

    return false;
}

function lookaheadInFirstSet(nonTerminal, token) {
    const productions = gram[nonTerminal];
    for (const prod of productions) {
        if (prod.length === 0) continue;
        const first = prod[0];
        if (typeof first === 'string' && first === token) return true;
        if (typeof first === 'number' && matchFirst(first, token)) return true;
    }
    return false;
}


function buildTraceTable(trace) {
    let tableHtml = '<h3>Tabela Sintática</h3><table border="1"><thead><tr><th>Pilha</th><th>Entrada</th><th>Ação</th><th>Comentário</th></tr></thead><tbody>';

    for (let step of trace) {
        let rowColor = '';
        if (step.action.includes('Erro')) rowColor = ' style="background-color: #f8d7da;"';
        else if (step.action.includes('Consome')) rowColor = ' style="background-color: #d1ecf1;"';
        else if (step.action.includes('Produção')) rowColor = ' style="background-color: #d4edda;"';
        else if (step.action.includes('Aceitação')) rowColor = ' style="background-color: #c3e6cb;"';

        tableHtml += `<tr${rowColor}><td>${step.stack}</td><td>${step.input}</td><td>${step.action}</td><td>${step.comment}</td></tr>`;
    }

    tableHtml += '</tbody></table>';

    document.getElementById('table-container').innerHTML = tableHtml;
}


//Adicionar uma forma de vizualizar a tabela sintática

