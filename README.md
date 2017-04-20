# Context-Free Grammar

```
<dict>     ::= {<premise>\n}+
<premise>  ::= <def>|<wff>
<def>      ::= <var>|<var><comment>
<var>      ::= <upper>{<upper>|<digit>}*
<comment>  ::= # {{<alnum>}+}*
<wff>      ::= <var>|<unary>|<var>(<wff>)|(<wff>)<unary>|<wff><binary><wff>
<operator> ::= <binary>|<unary>
<binary>   ::= <and>|<or>|<imp>|<eq>
<unary>    ::= <not>
<not>      ::= !
<and>      ::= &&
<or>       ::= ||
<imp>      ::= ->
<eq>       ::= ==
<alnum>    ::= <alpha>|<digit>
<digit>    ::= 0|1|2|3|4|5|6|7|8|9
<alpha>    ::= <upper>|<lower>
<upper>    ::= A|B|C|D|E|F|G|H|I|J|K|L|M|N|O|P|Q|R|S|T|U|V|W|X|Y|Z
<lower>    ::= a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z
```
