import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { ItemChangeHistory } from "../../../components/ItemChangeHistory";
import Layout from "../../../components/Layout";
import { getItemEdge } from "../../../data/edgeDatabase";
import { ChangelogItemData } from "../../../data/extractDataFromChangelog";

export const runtime = "experimental-edge";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

interface TheoremProps {
  theorem: ChangelogItemData;
}

export const getStaticProps: GetStaticProps<TheoremProps> = async (context) => {
  if (!context.params?.name || Array.isArray(context.params.name)) {
    return { notFound: true };
  }
  const theorem = await getItemEdge("v3", "theorem", context.params.name);
  if (!theorem) return { notFound: true };
  return { props: { theorem } };
};

const Theorem: NextPage<TheoremProps> = ({ theorem }) => {
  return (
    <Layout version="v3">
      <h1 className="text-xl">
        <span className="text-gray-400">Theorem</span> {theorem.name}
      </h1>
      <h4 className="text-sm mt-4">Modification history</h4>
      <div>
        <ItemChangeHistory item={theorem} version="v3" />
      </div>
    </Layout>
  );
};

export default Theorem;
