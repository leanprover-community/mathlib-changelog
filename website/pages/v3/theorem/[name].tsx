import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import ClientItemPage from "../../../components/ClientItemPage";
import Layout from "../../../components/Layout";
import Spinner from "../../../components/Spinner";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: false,
});

export const getStaticProps: GetStaticProps = () => ({ props: {} });

const TheoremPage: NextPage = () => {
  const router = useRouter();
  const name = router.query.name as string | undefined;

  if (!router.isReady || !name) {
    return (
      <Layout version="v3">
        <div className="flex justify-center py-12">
          <Spinner size={10} />
        </div>
      </Layout>
    );
  }

  return <ClientItemPage version="v3" itemType="theorem" name={name} />;
};

export default TheoremPage;
