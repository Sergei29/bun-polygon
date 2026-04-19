import { Queue } from "./queue";

export const GRAPH_NOT_FOUND = {
  you: ["alice", "bob", "claire"],
  alice: ["peggy"],
  bob: ["peggy", "anna"],
  claire: ["tom"],
  peggy: [],
  tom: [],
};

export const GRAPH_SUCCESS = {
  you: ["alice", "bob", "claire"],
  alice: ["peggy"],
  bob: ["peggy", "anna"],
  claire: ["tom", "johnny"], // johnny starts with `j`, this should be found first
  peggy: ["jenny", "alex"],
  tom: ["joe"],
  johnny: [],
};

const isPersonFound = (person: string) => {
  if (person.startsWith("j")) {
    return true;
  }
  return false;
};

export const breadthFirstSearch = (graph: Record<string, string[]>) => {
  const searchQueue = new Queue(...graph.you!);

  while (searchQueue.get().length > 0) {
    const person = searchQueue.pop()!;
    if (isPersonFound(person)) {
      return person;
    }

    const personsContacts = graph[person];
    personsContacts?.length && searchQueue.push(personsContacts);
  }

  return null;
};
