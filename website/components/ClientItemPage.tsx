import { FC } from "react";
import { useQuery } from "react-query";
import { fetchItem } from "../data/clientDatabase";
import { ItemType, LeanVersion } from "../data/types";
import { ItemChangeHistory } from "./ItemChangeHistory";
import Layout from "./Layout";
import Spinner from "./Spinner";

interface Props {
  version: LeanVersion;
  itemType: ItemType;
  name: string;
}

const typeLabel: Record<ItemType, string> = {
  theorem: "Theorem",
  def: "Def",
  structure: "Structure",
  inductive: "Inductive",
};

const ClientItemPage: FC<Props> = ({ version, itemType, name }) => {
  const { data: item, isLoading } = useQuery(
    ["item", version, itemType, name],
    () => fetchItem(version, itemType, name),
    { staleTime: Infinity }
  );

  if (isLoading) {
    return (
      <Layout version={version}>
        <div className="flex justify-center py-12">
          <Spinner size={10} />
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout version={version}>
        <h1 className="text-xl">
          <span className="text-gray-400">{typeLabel[itemType]}</span> not found
        </h1>
        <p className="text-gray-500 mt-2">
          No {itemType} found with name {name}.
        </p>
      </Layout>
    );
  }

  return (
    <Layout version={version}>
      <h1 className="text-xl">
        <span className="text-gray-400">{typeLabel[itemType]}</span>{" "}
        {item.name}
      </h1>
      <h4 className="text-sm mt-4">Modification history</h4>
      <div>
        <ItemChangeHistory item={item} version={version} />
      </div>
    </Layout>
  );
};

export default ClientItemPage;
