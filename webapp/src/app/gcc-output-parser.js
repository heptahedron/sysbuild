const gccOutputParseRe = /(.+?):\s*(.+)\s*:\s*(.+)\s*/;
const gccRowColTypeParseRe = /(\d+):(\d+):\s*(.+)/;
const gccOutputTypeTextSplitRe = /\s*(.+)\s*:\s*(.+)\s*/;
const makeOutputTypeTextSplitRe = /(.+?):(\d+):\s*(.+)/;
const makeErrorSplitRe = /make:\s\*\*\*\s*(.+)/;

const errorTypeMap = {
    'gcc': 'gcc',
    'cc1': 'gcc',
    'collect2': 'linker',
    'make': 'make'
};

class GccOutputParser {
    constructor() {
        // empty
    }

    parse(buildOutputStr) {
        var match, makeErr, lineColTypeMatch, typeTextSplitMatch, makefileColNum, row, col, buildErrorType, text, file, errors = [];

        buildOutputStr.split('\n').forEach(function (errorLine) {
            match = gccOutputParseRe.exec(errorLine);
            makeErr = makeErrorSplitRe.exec(errorLine);

            if (match) { //two colons
                lineColTypeMatch = gccRowColTypeParseRe.exec(match[2]);

                if (lineColTypeMatch) {//num:num: string
                    file = match[1];
                    row = parseInt(lineColTypeMatch[1]);
                    col = parseInt(lineColTypeMatch[2]);
                    typeTextSplitMatch = gccOutputTypeTextSplitRe.exec(lineColTypeMatch[3]);
                    if (typeTextSplitMatch) {
                        buildErrorType = typeTextSplitMatch[1];
                        text = typeTextSplitMatch[2] + ': ' + match[3];
                    } else {
                        buildErrorType = lineColTypeMatch[3];
                        text = match[3];
                    }
                } else {
                    // some gcc output without line info
                    makefileColNum = makeOutputTypeTextSplitRe.exec(match[0]);

                    if(makefileColNum){
                        file = makefileColNum[1];
                        row = makefileColNum[2];
                        text = makefileColNum[3];
                        buildErrorType = 'error';
                    }
                    else{
                        row = col = 0;
                        typeTextSplitMatch = gccOutputTypeTextSplitRe.exec(match[2]);
                        if (typeTextSplitMatch) {
                            buildErrorType = typeTextSplitMatch[1];
                            text = typeTextSplitMatch[2] + ': ' + match[3];
                        } else {
                            buildErrorType = match[2];
                            text = match[3];
                        }
                    }
                }


                var mappedType = errorTypeMap[match[1]];
                if(!mappedType) mappedType = 'compile';

                errors.push({
                    row: row,
                    column: col,
                    type: mappedType,
                    buildErrorType: buildErrorType,
                    text: text,
                    file: file
                });
            }
            else if(makeErr)
            {
                errors.push({
                    row: 0,
                    column: 0,
                    type: 'make',
                    buildErrorType: 'error',
                    text: '*** '+makeErr[1],
                    file: undefined
                });
            }


        });

        return errors;
    }
}

export default GccOutputParser;
