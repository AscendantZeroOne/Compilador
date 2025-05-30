// parsing_fixed.js - Grammar fully corrected based on LALG specification

nonTerminals = [
    'program', 'block', 'variable_declaration_part', 'variable_declaration_prime',
    'variable_declaration', 'type', 'identifier_list', 'identifier_list_prime',
    'subroutine_declaration_part', 'procedure_declaration_prime', 'procedure_declaration',
    'formal_parameters', 'formal_parameters_prime', 'formal_parameters_section', 'var',
    'compound_command', 'compound_command_prime', 'command', 'assignment', 'procedure_call',
    'procedure_call_prime', 'conditional_command', 'else', 'repeatable_command', 'expression',
    'expression_prime', 'relational', 'simple_expression', 'operation_a', 'simple_expression_prime',
    'operation_b', 'term', 'term_prime', 'operation_c', 'factor', 'variable', 'variable_prime',
    'expression_list', 'expression_list_prime', 'number', 'identifier'
];

nts = {};
nonTerminals.forEach((nt, i) => nts[nt] = i);

gram = {};

// Program structure
gram[nts.program] = [['KeyWord_Program', nts.identifier, 'Symbol_Semicolon', nts.block]];
gram[nts.block] = [[nts.variable_declaration_part, nts.subroutine_declaration_part, nts.compound_command],[]];

// Variable declarations
gram[nts.variable_declaration_part] = [[nts.variable_declaration, nts.variable_declaration_prime], []];
gram[nts.variable_declaration_prime] = [['Symbol_Semicolon', nts.variable_declaration, nts.variable_declaration_prime], []];
gram[nts.variable_declaration] = [[nts.type, nts.identifier_list], []];

gram[nts.type] = [['Type_Int'], ['Type_Boolean']];

gram[nts.identifier_list] = [[nts.identifier, nts.identifier_list_prime]];
gram[nts.identifier_list_prime] = [['Symbol_Comma', nts.identifier, nts.identifier_list_prime], []];

// Subroutine declarations
gram[nts.subroutine_declaration_part] = [[nts.procedure_declaration, nts.procedure_declaration_prime, nts.compound_command], []];
gram[nts.procedure_declaration_prime] = [['Symbol_Semicolon', nts.procedure_declaration, nts.procedure_declaration_prime], []];
gram[nts.procedure_declaration] = [['KeyWord_Procedure', nts.identifier, nts.formal_parameters, 'Symbol_Semicolon', nts.block]];

gram[nts.formal_parameters] = [['Symbol_LeftParenthesis', nts.formal_parameters_section, nts.formal_parameters_prime, 'Symbol_RightParenthesis'], []];
gram[nts.formal_parameters_prime] = [['Symbol_Semicolon', nts.formal_parameters_section, nts.formal_parameters_prime], []];
gram[nts.formal_parameters_section] = [[nts.identifier_list, 'Symbol_Colon', nts.type]];
gram[nts.var] = [['KeyWord_var'], []]; // mantida opcional

// Compound commands
gram[nts.compound_command] = [['KeyWord_Begin', nts.command, nts.compound_command_prime, 'KeyWord_End', 'Symbol_Semicolon']];
gram[nts.compound_command_prime] = [['Symbol_Semicolon', nts.command, nts.compound_command_prime], []];

// Commands
gram[nts.command] = [
    [nts.assignment],
    [nts.procedure_call],
    [nts.compound_command],
    [nts.conditional_command],
    [nts.repeatable_command],
	[]
];

gram[nts.assignment] = [[nts.variable, 'Operator_att', nts.expression]];



gram[nts.command_prime] = [
    ['Symbol_LeftParenthesis', nts.expression_list, 'Symbol_RightParenthesis'],
    [nts.variable_prime, 'Operator_att', nts.expression]
];



// Assignment
gram[nts.assignment] = [[nts.variable, 'Operator_att', nts.expression]];

// Procedure call
gram[nts.procedure_call] = [
    [nts.identifier, nts.procedure_call_prime],
    ['KeyWord_Write', 'Symbol_LeftParenthesis', nts.expression_list, 'Symbol_RightParenthesis'],
    ['KeyWord_Read', 'Symbol_LeftParenthesis', nts.expression_list, 'Symbol_RightParenthesis']
];
gram[nts.procedure_call_prime] = [['Symbol_LeftParenthesis', nts.expression_list, 'Symbol_RightParenthesis'], []];

// Conditional
gram[nts.conditional_command] = [['KeyWord_If', nts.expression, 'KeyWord_Then', nts.command, nts.else]];
gram[nts.else] = [['KeyWord_Else', nts.command], []];

// Repeat command
gram[nts.repeatable_command] = [['KeyWord_While', nts.expression, 'KeyWord_Do', nts.command]];

// Expressions
gram[nts.expression] = [[nts.simple_expression, nts.expression_prime]];
gram[nts.expression_prime] = [[nts.relational, nts.simple_expression], []];
gram[nts.relational] = [
    ['Operator_equivalence'], ['Operator_<>'], ['Operator_lesser'],
    ['Operator_lesserequal'], ['Operator_greaterequal'], ['Operator_greater']
];

gram[nts.simple_expression] = [
    [nts.operation_a, nts.term, nts.simple_expression_prime],
    [nts.term, nts.simple_expression_prime]
];
gram[nts.operation_a] = [['Operator_plus'], ['Operator_-'], []];
gram[nts.simple_expression_prime] = [[nts.operation_b, nts.term, nts.simple_expression_prime], []];
gram[nts.operation_b] = [['Operator_plus'], ['Operator_-'], ['Operator_logicalOperatorOr']];

gram[nts.term] = [[nts.factor, nts.term_prime]];
gram[nts.term_prime] = [[nts.operation_c, nts.factor, nts.term_prime], []];
gram[nts.operation_c] = [['Operator_multiplication'], ['Operator_div'], ['Operator_logicalOperatorAnd']];

gram[nts.factor] = [
    [nts.identifier],
    [nts.variable],
    [nts.number],
    ['Symbol_LeftParenthesis', nts.expression, 'Symbol_RightParenthesis'],
    ['Operator_logicalOperatorNot', nts.factor]
];

// Variable
gram[nts.variable] = [[nts.identifier, nts.variable_prime]];
gram[nts.variable_prime] = [['Symbol_LeftBracket', nts.expression, 'Symbol_RightBracket'], []];

gram[nts.expression_list] = [
    [nts.expression, nts.expression_list_prime],
    []  // allow empty parameter list
];
gram[nts.expression_list_prime] = [
    ['Symbol_Comma', nts.expression, nts.expression_list_prime],
    []  // epsilon
];


// Identifier and number
gram[nts.identifier] = [['Identifier']];
gram[nts.number] = [['Number_Int']];