import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Constants for the Angular and Next.js apps on Vercel
const angularAppUrl = "https://angular-poc-eight.vercel.app";
const nextJsAppUrl = "https://angular-nextjs-poc.vercel.app";
const domainName = "poc-aws.mesquita.dev";

// Function to get or create an ACM certificate
async function getOrCreateCertificate() {
    try {
        const cert = await aws.acm.getCertificate({
            domain: domainName,
            statuses: ["ISSUED"],
        });
        return cert;
    } catch (e) {
        console.log("Certificate not found, creating a new one...");
        const cert = new aws.acm.Certificate("certificate", {
            domainName: domainName,
            validationMethod: "DNS",
            tags: {
                Name: "Pulumi-managed Certificate",
            },
        });

        const hostedZone = await aws.route53.getZone({ name: domainName });

        const validationRecord = new aws.route53.Record(`validation-${domainName}`, {
            zoneId: hostedZone.id,
            name: cert.domainValidationOptions[0].resourceRecordName,
            type: cert.domainValidationOptions[0].resourceRecordType,
            records: [cert.domainValidationOptions[0].resourceRecordValue],
            ttl: 60,
        });

        await new aws.acm.CertificateValidation("certificateValidation", {
            certificateArn: cert.arn,
            validationRecordFqdns: [validationRecord.fqdn],
        });

        console.log("Certificate validated");
        return cert;
    }
}

// Create the ACM certificate if it doesn't exist
const certificatePromise = getOrCreateCertificate();

async function createResources() {
    try {
        const certificate = await certificatePromise;

        // Create an S3 bucket to host the proxy
        const bucket = new aws.s3.Bucket("proxy-bucket", {
            website: {
                indexDocument: "index.html",
            },
        });

        // Create an S3 bucket for CloudFront logs
        const loggingBucket = new aws.s3.Bucket("cloudfront-logs-bucket", {
            acl: "log-delivery-write",
            forceDestroy: true,
        });

        // Get the current AWS account ID
        const currentIdentity = await aws.getCallerIdentity();
        const accountId = currentIdentity.accountId;

        // Attach a policy to allow CloudFront to write logs to the logging bucket
        new aws.s3.BucketPolicy("loggingBucketPolicy", {
            bucket: loggingBucket.bucket,
            policy: pulumi.interpolate`{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudfront.amazonaws.com"
                        },
                        "Action": "s3:PutObject",
                        "Resource": "arn:aws:s3:::${loggingBucket.bucket}/cloudfront-logs/*",
                        "Condition": {
                            "StringEquals": {
                                "AWS:SourceAccount": "${accountId}"
                            },
                            "ArnLike": {
                                "AWS:SourceArn": "arn:aws:cloudfront::*:distribution/*"
                            }
                        }
                    }
                ]
            }`,
        });

        // Upload a simple index.html file to the bucket
        const indexContent = `<html>
<head><title>Proxy Project</title></head>
<body><h1>Proxy Project</h1><p>This project serves as a proxy to route requests to Angular and Next.js apps.</p></body>
</html>`;

        new aws.s3.BucketObject("index", {
            bucket: bucket,
            content: indexContent,
            key: "index.html",
            contentType: "text/html",
        });

        // Create a CloudFront distribution
        const distribution = new aws.cloudfront.Distribution("cdn", {
            enabled: true,
            origins: [
                {
                    originId: "s3-origin",
                    domainName: bucket.websiteEndpoint,
                    customOriginConfig: {
                        originProtocolPolicy: "http-only",
                        httpPort: 80,
                        httpsPort: 443,
                        originSslProtocols: ["TLSv1.2"],
                    },
                },
                {
                    originId: "angular-app",
                    domainName: angularAppUrl.replace("https://", ""),
                    customOriginConfig: {
                        originProtocolPolicy: "https-only",
                        httpPort: 443,
                        httpsPort: 443,
                        originSslProtocols: ["TLSv1.2"],
                    },
                },
                {
                    originId: "nextjs-app",
                    domainName: nextJsAppUrl.replace("https://", ""),
                    customOriginConfig: {
                        originProtocolPolicy: "https-only",
                        httpPort: 443,
                        httpsPort: 443,
                        originSslProtocols: ["TLSv1.2"],
                    },
                },
            ],
            defaultCacheBehavior: {
                targetOriginId: "angular-app",
                viewerProtocolPolicy: "redirect-to-https",
                allowedMethods: ["GET", "HEAD", "OPTIONS"],
                cachedMethods: ["GET", "HEAD"],
                forwardedValues: {
                    queryString: true,
                    cookies: {
                        forward: "none",
                    },
                    headers: ["Host"],
                },
                compress: true,
                minTtl: 0,
                defaultTtl: 3600,
                maxTtl: 86400,
            },
            orderedCacheBehaviors: [
                {
                    pathPattern: "/n1/*",
                    targetOriginId: "nextjs-app",
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD"],
                    forwardedValues: {
                        queryString: true,
                        cookies: {
                            forward: "none",
                        },
                        headers: ["Host"],
                    },
                    compress: true,
                    minTtl: 0,
                    defaultTtl: 3600,
                    maxTtl: 86400,
                },
                {
                    pathPattern: "/_next/*",
                    targetOriginId: "nextjs-app",
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD"],
                    forwardedValues: {
                        queryString: true,
                        cookies: {
                            forward: "none",
                        },
                        headers: ["Host"],
                    },
                    compress: true,
                    minTtl: 0,
                    defaultTtl: 3600,
                    maxTtl: 86400,
                },
            ],
            viewerCertificate: {
                acmCertificateArn: certificate.arn,
                sslSupportMethod: "sni-only",
                minimumProtocolVersion: "TLSv1.2_2019",
            },
            restrictions: {
                geoRestriction: {
                    restrictionType: "none",
                },
            },
            loggingConfig: {
                bucket: loggingBucket.bucketDomainName,
                includeCookies: false,
                prefix: "cloudfront-logs/",
            },
            defaultRootObject: "index.html",
        });

        // Get the existing hosted zone
        const hostedZone = await aws.route53.getZoneOutput({ name: domainName });

        // Create Route 53 record
        new aws.route53.Record("aliasRecord", {
            zoneId: hostedZone.id,
            name: domainName,
            type: "A",
            aliases: [
                {
                    name: distribution.domainName,
                    zoneId: distribution.hostedZoneId,
                    evaluateTargetHealth: true,
                },
            ],
        });

        // Export the URLs and other important info
        return {
            bucketUrl: bucket.websiteEndpoint,
            cdnUrl: distribution.domainName,
            aliasRecord: domainName,
        };
    } catch (error) {
        console.error("Error creating resources:", error);
        throw error;
    }
}

// Run the createResources function and export the results
const outputs = createResources();
export const bucketUrl = outputs.then(result => result.bucketUrl);
export const cdnUrl = outputs.then(result => result.cdnUrl);
export const aliasRecord = outputs.then(result => result.aliasRecord);
