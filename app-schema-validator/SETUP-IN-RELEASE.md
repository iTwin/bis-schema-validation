### Guidelines to setup the tool in release pipeline

1. Go to the release pipeline and edit it.
2. Add [bis-schemas](https://github.com/iTwin/bis-schemas) repository artifact to this pipeline.

   ![Add Artifact](./media/add-bis-schemas-repo-artifact.png)

   1. Do the following settings:

  ![Artifact Settings](./media/bis-schema-repo-artifact-settings.png)

3. Now go to the stage where you want to perform the schema validation.
4. Add an agent job and name it 'BIS - Schema Tests'.
5. Select the `windows-latest` agent from the Azure Pipelines pool for execution of this job.
6. Add the '**BIS - Verify Installer Schemas**' task group and provide the required fields
   1. installerZipFilePath: Path to the installer zip file.
   2. bisRepoPath: Path to the bis-schemas repository.
   3. outputDir: Path where output files will be generated.
7. Save the release pipeline.
