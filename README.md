This little webpage can generate your
put-to and take-from operators for a C++
struct.

RESTRICTIONS:

This only works for structs (soon to be classes as well).
The structs must be plain old data. It does not know the difference
between data members and methods.

It is not possible to properly generate code for a pointer to an array
without extra information. Pointers must point to a sole type. Arrays
must be declared on the stack with a fixed length.


IN THE WORKS:

I need it to support enums in the struct definitions.

Support for classes soon.

Generation of individual methods for each data member
to write into the file just that data member.

BUG:

When handling pointers, it only allocates space for a char, not the correct
type. Whoops. Will fix that later.

Minor formatting issues. Too lazy to deal with it right now.


Terrible Code:
Yes it is, I did this in 2 days, and did not care to
optimize the solution, format, etc. Sorry, at least it
does something neat!