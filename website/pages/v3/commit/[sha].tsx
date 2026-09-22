import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { useRouter } from "next/router";
import ClientCommitPage from "../../../components/ClientCommitPage";
import Layout from "../../../components/Layout";
import Spinner from "../../../components/Spinner";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: false,
});

export const getStaticProps: GetStaticProps = () => ({ props: {} });

const CommitPage: NextPage = () => {
  const router = useRouter();
  const sha = router.query.sha as string | undefined;

  if (!router.isReady || !sha) {
    return (
      <Layout version="v3">
        <div className="flex justify-center py-12">
          <Spinner size={10} />
        </div>
      </Layout>
    );
  }

  return <ClientCommitPage version="v3" sha={sha} />;
};

export default CommitPage;
