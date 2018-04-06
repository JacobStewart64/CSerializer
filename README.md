This little webpage can generate your
put-to and take-from operators for a C++
struct.

RESTRICTIONS:

The structs/classes must be plain old data. It does not know the difference
between data members and methods.

You can have enums in the struct definition. They will be used correctly
in the generated code, you can change the enum and you're good. The generated
code should still work.

It is not possible to properly generate code for a pointer to an array
without extra information. Pointers must point to a sole type. Arrays
must be declared on the stack with a fixed length.


IN THE WORKS:

Generation of individual methods for each data member
to write into the file just that data member.