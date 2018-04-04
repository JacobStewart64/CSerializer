const generate = () => {
    const words = input.value.replace(/\n/g," ").replace(/\t/g," ").split(" ");

    const outputwords = words.concat();

    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].trim();
    }

    let structcount = 0;
    const structnemes = [];

    while (true) {
        while (words.shift() != "struct" && words.length > 0) {}

        if (words.length === 0) {
            break;
        }

        const structnames = [];

        const structname = words.shift();
        structnemes.push(structname);

        words.shift();
        words.shift();

        while (true) {
            let word;
            if ((word = words.shift()) === "unsigned") {
                if (words.shift().includes('*')) {
                    //this element is an unsigned pointer
                    structnames.push([words.shift().slice(0, this.length-1), "p"]);
                }
                else {
                    //coulde be array
                    word = words.shift();
                    if (word.endsWith('];')) {
                        let indexofopenbracket = 0;
                        for (let i = 0; i < word.length; i++) {
                            if (word[i] == '[') {
                                indexofopenbracket = i;
                                break;
                            }
                        }
                        let indexofclosebracket = 0;
                        for (let i = indexofopenbracket; i < word.length; i++) {
                            if (word[i] == ']') {
                                indexofclosebracket = i;
                            }
                        }
                        const length = Number(word.slice(indexofopenbracket+1, indexofclosebracket));
                        structnames.push([word.slice(0, word.length - 2 - (indexofclosebracket - indexofopenbracket)), length]);
                    }
                    else {
                        structnames.push([word.slice(0, word.length-1)]);
                    }
                }
            }
            else if (word.includes('*')) {
                //this element is a pointer
                structnames.push([words.shift().slice(0, this.length-1), "p"]);
            }
            else if (word === '};') {
                break;
            }
            else if (word === "") {
                //do nothing
            }
            else {
                //could be array
                word = words.shift();
                if (word.endsWith('];')) {
                    let indexofopenbracket = 0;
                    for (let i = 0; i < word.length; i++) {
                        if (word[i] == '[') {
                            indexofopenbracket = i;
                            break;
                        }
                    }
                    let indexofclosebracket = 0;
                    for (let i = indexofopenbracket; i < word.length; i++) {
                        if (word[i] == ']') {
                            indexofclosebracket = i;
                        }
                    }
                    const length = Number(word.slice(indexofopenbracket+1, indexofclosebracket));
                    structnames.push([word.slice(0, word.length - 2 - (indexofclosebracket - indexofopenbracket)), length]);
                }
                else {
                    structnames.push([word.slice(0, word.length-1)]);
                }
            }
        }
        console.log(structnames);
        //we have the names of variables of a struct
        //we have info about whether they are arrays or pointers
        //there are only so many different things I have to do here
        //make templates for each kind of code I have to write
        //insert the variable names into it like a glorified copy pasta machine

        const friendprotos = `\nprivate:\n\tfriend std::ostream& operator<<(std::ostream &os, const ${structname} &e);\n\tfriend std::istream& operator>>(std::istream &os, ${structname} &e);\n`;

        //find the place to put the friend protos
        let indexofstructclosing = 0;
        let count = 0;
        for (let i = 0; i < outputwords.length; i++) {
            if (outputwords[i] == '};') {
                if (count === structcount) {
                    indexofstructclosing = i;
                    break;
                }
                else {
                    count++;
                }                
            }
        }
        outputwords.splice(indexofstructclosing, 0, friendprotos);
        indexofstructclosing += 2;

        //generate code string - operator<< && operator>> definitions:
        let outpart1 = `\n\nstd::ostream& operator<<(std::ostream &os, const ${structname} &e)\n{\n`
        const end = '}\n\n';

        //the put to
        for (let i = 0; i < structnames.length; i++) {
            if (structnames[i].length > 1) {
                if (structnames[i][1] === 'p') {
                    //generate a pointer put to
                    const pointerputto = `\tif (e.${structnames[i][0]}) {\n\t\tos << *e.${structnames[i][0]} << "\\n";\n\t}\n\telse {\n\t\tos << "p___" << "\\n";\n\t}\n`;
                    outpart1 += pointerputto;                            
                }
                else {
                    //generate an array put to
                    const arrayputto = `\tfor (int i = 0; i < ${structnames[i][1]}; i++)\n\t{\n\t\tos << e.${structnames[i][0]}[i] << "\\n";\n\t}\n`;
                    outpart1 += arrayputto;
                }
            }
            else {
                //generate a regular old put to
                const regputto = `\tos << e.${structnames[i]} << "\\n";\n`
                outpart1 += regputto;
            }
        }
        outpart1 += '\treturn os;\n';
        outpart1 += end;

        //the pull out
        let outpart2 = `std::istream& operator>>(std::istream &os, ${structname} &e)\n{\n`
        for (let i = 0; i < structnames.length; i++) {
            if (structnames[i].length > 1) {
                if (structnames[i][1] === 'p') {
                    //generate a pointer pull out
                    const pointerputto = `\tchar key[5];\n\tos >> key;\n\tif (!strcmp(key, "p___")) {\n\t\te.${structnames[i][0]} = nullptr;\n\t}\n\telse {\n\tfor (int i = 0; i < 5; i++) {\n\t\tos.putback(key[i]);\n\t}\n\te.${structnames[i][0]} = new char;\n\tos >> *e.${structnames[i][0]};\n\t}\n`;
                    outpart2 += pointerputto;                            
                }
                else {
                    //generate an array pull out
                    const arrayputto = `\tfor (int i = 0; i < ${structnames[i][1]}; i++)\n\t{\n\t\tos >> e.${structnames[i][0]}[i];\n\t}\n`;
                    outpart2 += arrayputto;
                }
            }
            else {
                //generate a regular old pull out
                const regputto = `\tos >> e.${structnames[i]};\n`
                outpart2 += regputto;
            }
        }
        outpart2 += '\treturn os;\n'
        outpart2 += end + '\n';

        outpart1 += outpart2;
        //console.log(outpart1);

        //put it after indexofstructclosing
        outputwords.splice(indexofstructclosing, 0, outpart1);

        //locate the first struct name at structcount, first appearance will always be the start of the definition
        let location = 0;
        for (let i = 0; i < outputwords.length; i++) {
            if (outputwords[i] === structnemes[structcount]) {
                location = i;
                break;
            }
        }
        if (structcount > 0) {
            outputwords.splice(location-2, 1);
        }
        else {
            location++;
        }
        location++;
        location++;
        console.log('the output:',outputwords);
        while (!outputwords[location].startsWith('\nprivate:')) {
            outputwords[location] = '\n\t' + outputwords[location].trim();;
            location++;
            if (!outputwords[location].startsWith('\nprivate:')) {
                location++;
                if (!outputwords[location].startsWith('\nprivate:')) {
                    location++;
                    if (outputwords[location-3] === '\n\tunsigned') {
                        if (!outputwords[location].startsWith('\nprivate:')) {
                            location++;
                        }
                        else {
                            break;
                        }
                    }
                }
                else {
                    break;
                }
            }
            else {
                break;
            }
        }

        structcount++;

    }

    output.value = outputwords.join(" ");
}

window.onload = () => {
    const genbutton = document.getElementById("genbutton");
    const input = document.getElementById("input");
    const output = document.getElementById("output");

    genbutton.onclick = generate;
};