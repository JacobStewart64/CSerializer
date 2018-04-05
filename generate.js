const toWordsArray = (str) => {
    const perfectwords = [];
    const uglywords = str.replace(/\n/g," ").replace(/\t/g," ").split(" ");
    uglywords.forEach((word) => {
        if (word !== "") {
            perfectwords.push(word);
        }
    });
    return perfectwords;
}

const dropLastChar = (str) => {
    return str.slice(0, str.length-1);
}

const generate = () => {
    const words = toWordsArray(input.value);
    console.log(words);
    const structnames = [];
    const varnames = [];
    for (let i = 0; i < words.length; i++) {
        if (words[i] === "struct" || words[i] === "class") {
            words[i+1] = " " + words[i+1] + " ";
            structnames.push(words[++i]);
            varnames.push([]);
        }
        else if (words[i] === "const") {
            //do nothing
        }
        else if (words[i] === "unsigned") {
            if (words[++i].includes('*')) {
                //it is an unsigned pointer
                varnames[structnames.length-1].push([dropLastChar(words[i+1]), "p", words[i-1]+" "+dropLastChar(words[i])]);
                words[i] = " " + words[i] + " ";
                ++i;
                words[i] = " " + words[i] + "\n\t";
            }
            else {
                //could be array
                if (words[++i].endsWith('];')) {
                    let indexofopenbracket = words[i].indexOf('[');
                    let indexofclosebracket = words[i].indexOf(']');
                    const length = words[i].slice(indexofopenbracket+1, indexofclosebracket);
                    varnames[structnames.length-1].push([words[i].slice(0, words[i].length - 2 - (indexofclosebracket - indexofopenbracket)), length]);
                    words[i] = " " + words[i] + "\n\t";
                    words[i-2] += " ";
                }
                else {
                    //it was not an array
                    varnames[structnames.length-1].push([dropLastChar(words[i])]);
                    words[i] = " " + words[i] + "\n\t";
                    words[i-2] += " ";
                }
            }
        }
        else if (words[i].includes('*')) {
            //this element is a pointer
            varnames[structnames.length-1].push([dropLastChar(words[i+1]), "p", dropLastChar(words[i])]);
            ++i;
            words[i] = " " + words[i] + "\n\t";
        }
        else if (words[i] === '};') {
            //do nothing
        }
        else if (words[i] === '{') {
            words[i] += '\n\t';
        }
        else {
            //could be array
            if (words[++i].endsWith('];')) {
                let indexofopenbracket = words[i].indexOf('[');
                let indexofclosebracket = words[i].indexOf(']');
                const length = words[i].slice(indexofopenbracket+1, indexofclosebracket);
                varnames[structnames.length-1].push([words[i].slice(0, words[i].length - 2 - (indexofclosebracket - indexofopenbracket)), length]);
                words[i] = " " + words[i] + "\n\t";
            }
            else {
                varnames[structnames.length-1].push([dropLastChar(words[i])]);
                words[i] = " " + words[i] + "\n\t";
            }
        }
    }
    console.log(structnames);
    console.log(varnames);
    //we have the names of variables of a struct
    //we have info about whether they are arrays or pointers
    //we have the type name if it is a pointer
    //there are only so many different things I have to do here
    //make templates for each kind of code I have to write
    //insert the variable names into it like a glorified copy pasta machine

    const generatedcode = [];

    structnames.forEach((name, i) => {
        generatedcode.push([]);
        const friendprotos = `\nprivate:\n\tfriend std::ostream& operator<<(std::ostream &os, const ${name} &e);\n\tfriend std::istream& operator>>(std::istream &os, ${name} &e);\n`;
        generatedcode[i].push(friendprotos);

        //generate code string - operator<< definition:
        let outpart1 = `\n\nstd::ostream& operator<<(std::ostream &os, const ${name} &e)\n{\n`
        const end = '}\n\n';

        varnames[i].forEach((varname) => {
            if (varname.length > 1) {
                if (varname[1] === 'p') {
                    //generate a pointer put to
                    const pointerputto = `\tif (e.${varname[0]}) {\n\t\tos << *e.${varname[0]} << "\\n";\n\t}\n\telse {\n\t\tos << "p___" << "\\n";\n\t}\n`;
                    outpart1 += pointerputto;                            
                }
                else {
                    //generate an array put to
                    const arrayputto = `\tfor (int i = 0; i < ${varname[1]}; i++)\n\t{\n\t\tos << e.${varname[0]}[i] << "\\n";\n\t}\n`;
                    outpart1 += arrayputto;
                }
            }
            else {
                //generate a regular old put to
                const regputto = `\tos << e.${varname} << "\\n";\n`
                outpart1 += regputto;
            }
        });
        outpart1 += '\treturn os;\n';
        outpart1 += end;

        outpart1 += `std::istream& operator>>(std::istream &os, ${name} &e)\n{\n`;
        varnames[i].forEach((varname) => {
            if (varname.length > 1) {
                if (varname[1] === 'p') {
                    //generate a pointer pull out
                    const pointerputto = `\tchar key[5];\n\tos >> key;\n\tif (!strcmp(key, "p___")) {\n\t\te.${varname[0]} = nullptr;\n\t}\n\telse {\n\t\tfor (int i = 0; i < 5; i++) {\n\t\t\tos.putback(key[i]);\n\t\t}\n\t\te.${varname[0]} = new ${varname[2]};\n\t\tos >> *e.${varname[0]};\n\t}\n`;
                    outpart1 += pointerputto;                            
                }
                else {
                    //generate an array pull out
                    const arrayputto = `\tfor (int i = 0; i < ${varname[1]}; i++)\n\t{\n\t\tos >> e.${varname[0]}[i];\n\t}\n`;
                    outpart1 += arrayputto;
                }
            }
            else {
                //generate a regular old pull out
                const regputto = `\tos >> e.${varname};\n`
                outpart1 += regputto;
            }
        });
        outpart1 += '\treturn os;\n'
        outpart1 += end + '\n';
        generatedcode[i].push(outpart1);
    });

    //for every struct name, there is an array of generated code for that struct
    //put it into the words array correctly
    for (let i = 0; i < structnames.length; ++i) {
        let index = words.indexOf(structnames[i]);
        index = words.indexOf('};', index);
        words.splice(index, 0, generatedcode[i][0]);
        words.splice(index+2, 0, generatedcode[i][1]);
    }
    
    output.value = words.join("");
}

window.onload = () => {
    const genbutton = document.getElementById("genbutton");
    const input = document.getElementById("input");
    const output = document.getElementById("output");

    genbutton.onclick = generate;
};