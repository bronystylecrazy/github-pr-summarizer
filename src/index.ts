import { Probot } from "probot";

console.log("Started application");

export = (app: Probot) => {
  app.on(
    ["pull_request.opened", "pull_request.synchronize"],
    async (context) => {
      const repo = context.repo();
      const pull_request = context.payload.pull_request;

      if (pull_request.state === "closed" || pull_request.locked) {
        console.log("invalid event payload");
        return "invalid event payload";
      }

      const data = await context.octokit.repos.compareCommits({
        owner: repo.owner,
        repo: repo.repo,
        base: context.payload.pull_request.base.sha,
        head: context.payload.pull_request.head.sha,
      });

      let { files: changedFiles, commits } = data.data;

      if (context.payload.action === "synchronize" && commits.length >= 2) {
        const {
          data: { files },
        } = await context.octokit.repos.compareCommits({
          owner: repo.owner,
          repo: repo.repo,
          base: commits[commits.length - 2].sha,
          head: commits[commits.length - 1].sha,
        });

        const ignoreList = (process.env.IGNORE || process.env.ignore || "")
          .split("\n")
          .filter((v) => v !== "");

        const filesNames = files?.map((file) => file.filename) || [];
        changedFiles = changedFiles?.filter(
          (file) =>
            filesNames.includes(file.filename) &&
            !ignoreList.includes(file.filename)
        );
      }

      if (!changedFiles?.length) {
        console.log("no change found");
        return "no change";
      }

      // Changes

      for (const element of changedFiles) {
        const file = element;
        const patch = file.patch ?? "";

        if (file.status !== "modified" && file.status !== "added") {
          continue;
        }

        if (!patch || patch.length > 10000) {
          console.log(
            `${file.filename} skipped caused by its diff is too large`
          );
          continue;
        }

        try {
          const res = `Below is a code patch, please help me do a brief code review on it. Any bug risks and/or improvement suggestions are welcome: ${patch}`;

          if (res) {
            await context.octokit.pulls.createReviewComment({
              repo: repo.repo,
              owner: repo.owner,
              pull_number: context.pullRequest().pull_number,
              commit_id: commits[commits.length - 1].sha,
              path: file.filename,
              body: res,
              position: patch.split("\n").length - 1,
            });
          }
        } catch (e) {
          console.error(`review ${file.filename} failed`, e);
        }
      }

      console.info(
        "successfully reviewed",
        context.payload.pull_request.html_url
      );

      return "success";
    }
  );
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
