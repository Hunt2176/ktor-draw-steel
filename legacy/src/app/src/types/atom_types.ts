import { Atom, SetStateAction, WritableAtom } from "jotai";
import { atomFamily } from "jotai/utils";

export type BasicWritableAtom<T> = WritableAtom<T, [SetStateAction<T>], T | void>;

export type AtomFamily<Param, AtomType extends Atom<any>> = ReturnType<typeof atomFamily<Param, AtomType>>;